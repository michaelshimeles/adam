import { defineChannel, POST, type SessionHandle } from "eve/channels";

/**
 * Generic inbound webhook channel.
 *
 * Any external system (Zapier, GitHub Actions, a cron somewhere, another
 * agent) can talk to this agent by POSTing JSON to the channel route. On
 * Convex the route is exposed as `POST https://<deployment>.convex.site/channels/webhook`
 * (convex/http.ts forwards into the bundle's channel dispatcher).
 *
 *   POST /channels/webhook
 *   x-webhook-secret: <WEBHOOK_CHANNEL_SECRET>
 *   { "message": "...", "conversationId"?: "...", "replyUrl"?: "https://..." }
 *
 * - `conversationId` is the continuation token: reuse it to keep talking in
 *   the same durable session; omit it to start a fresh one.
 * - `replyUrl` (optional) gets a POST with the agent's completed replies:
 *   { sessionId, conversationId, message }. Without it the webhook is
 *   fire-and-forget (the turn still runs durably; transcripts are visible
 *   in the dashboard). Must be a public http(s) URL — private, link-local,
 *   and cloud-metadata addresses are rejected at intake (SSRF guard).
 *
 * Auth is a shared secret in the WEBHOOK_CHANNEL_SECRET env var — set on
 * the Convex deployment (the builder pipeline generates one per agent).
 * Sessions started here are deployment-initiated: the Convex dispatcher
 * marks them `system`, so turns run on the deployment's own gateway key.
 */

interface WebhookState {
  replyUrl: string | null;
  conversationId: string | null;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Constant-time string comparison for the shared secret (content-independent
 * timing; length still leaks, which is fine for random tokens).
 */
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    // charCodeAt is NaN out of range; ^ coerces NaN to 0.
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * SSRF guard: replies may only go to public http(s) endpoints. Blocks
 * loopback/private/link-local IP literals (including the cloud metadata
 * address 169.254.169.254) and obvious internal hostnames. Defense in depth
 * on top of the channel secret; redirects are refused at fetch time too.
 */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0 || a === 10 || a === 127) return true; // this-net, private, loopback
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (host.includes(":")) {
    // IPv6 literal — allow only clearly-global addresses.
    if (host === "::" || host === "::1") return true; // unspecified, loopback
    if (host.startsWith("::ffff:")) return true; // v4-mapped
    if (/^f[cd]/.test(host)) return true; // fc00::/7 unique-local
    if (/^fe[89ab]/.test(host)) return true; // fe80::/10 link-local
  }
  return false;
}

/**
 * Returns the normalized reply URL, or null when it isn't an acceptable
 * public http(s) endpoint. WHATWG URL parsing canonicalizes integer/hex
 * IPv4 forms (http://2130706433/ → 127.0.0.1) before the host check, so
 * encoded literals can't sneak past. DNS names that *resolve* to private
 * ranges are out of scope here (would need resolver pinning).
 */
function parseReplyUrl(raw: string): string | null {
  if (raw.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (isBlockedHost(url.hostname)) return null;
  return url.toString();
}

export default defineChannel<
  WebhookState,
  { state: WebhookState; session: { id: string } }
>({
  state: { replyUrl: null, conversationId: null },

  // Expose durable state + session id to event handlers (typed channel arg).
  context: (state, session: SessionHandle) => ({ state, session }),

  routes: [
    POST("/webhook", async (req, { send }) => {
      const secret = process.env.WEBHOOK_CHANNEL_SECRET;
      if (!secret) {
        return json(503, {
          error: "webhook channel not configured (WEBHOOK_CHANNEL_SECRET unset)",
        });
      }
      const provided = req.headers.get("x-webhook-secret") ?? "";
      if (!timingSafeEqual(provided, secret)) {
        return json(401, { error: "unauthorized" });
      }

      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return json(400, { error: "invalid JSON body" });
      }

      const message =
        typeof body.message === "string" ? body.message.trim() : "";
      if (!message) {
        return json(400, { error: '"message" (string) is required' });
      }
      const conversationId =
        typeof body.conversationId === "string" && body.conversationId.trim()
          ? body.conversationId.trim()
          : crypto.randomUUID();
      let replyUrl: string | null = null;
      if (typeof body.replyUrl === "string" && body.replyUrl.trim()) {
        replyUrl = parseReplyUrl(body.replyUrl.trim());
        if (!replyUrl) {
          return json(400, {
            error:
              '"replyUrl" must be a public http(s) URL (private and internal addresses are not allowed)',
          });
        }
      }

      const session = await send(message, {
        auth: {
          authenticator: "webhook-secret",
          principalType: "service",
          principalId: "webhook",
          attributes: {},
        },
        continuationToken: conversationId,
        state: { replyUrl, conversationId },
      });

      return json(200, { ok: true, sessionId: session.id, conversationId });
    }),
  ],

  events: {
    "message.completed"(data, channel) {
      // Intermediate assistant messages before tool calls aren't replies.
      if (data.finishReason === "tool-calls" || !data.message) return;
      const { replyUrl, conversationId } = channel.state;
      if (!replyUrl) return;
      const payload = JSON.stringify({
        sessionId: channel.session.id,
        conversationId,
        message: data.message,
      });
      return fetch(replyUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        // A vetted public URL must not bounce us to an internal address.
        redirect: "error",
      }).then(
        () => undefined,
        (err) => {
          console.warn(`[webhook channel] reply delivery failed: ${err}`);
        },
      );
    },
  },
});
