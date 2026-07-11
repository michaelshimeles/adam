import { defineChannel, POST } from "eve/channels";

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
 *   in the dashboard).
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

export default defineChannel<WebhookState>({
  state: { replyUrl: null, conversationId: null },

  routes: [
    POST("/webhook", async (req, { send }) => {
      const secret = process.env.WEBHOOK_CHANNEL_SECRET;
      if (!secret) {
        return json(503, {
          error: "webhook channel not configured (WEBHOOK_CHANNEL_SECRET unset)",
        });
      }
      if (req.headers.get("x-webhook-secret") !== secret) {
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
      const replyUrl =
        typeof body.replyUrl === "string" && body.replyUrl.startsWith("http")
          ? body.replyUrl
          : null;

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
      }).then(
        () => undefined,
        (err) => {
          console.warn(`[webhook channel] reply delivery failed: ${err}`);
        },
      );
    },
  },
});
