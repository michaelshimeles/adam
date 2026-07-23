import { defineChannel, POST } from "eve/channels";

import { backend, convexClient, serviceSecret } from "../lib/convex";
import proactive from "./proactive";
import telegram from "./telegram";

/**
 * Event triggers: inbound webhooks that wake the agent when something
 * happens (a deploy fails, a form is submitted, a payment lands). Endpoints
 * are minted from chat with the create_webhook tool; rows live in the
 * Convex `triggers` table. On Convex the route is exposed at
 * `POST https://<deployment>.convex.site/hooks/<hookId>/<secret>`
 * (convex/http.ts forwards into the bundle's channel dispatcher) — the
 * secret rides in the path because most services can only be given a bare
 * URL.
 *
 * Delivery follows origin: hooks created from Telegram report into that DM;
 * hooks created from the web chat run on the proactive channel and land in
 * the dashboard inbox.
 */

const MAX_PAYLOAD_CHARS = 6000;

interface TriggerRow {
  hookId: string;
  secret: string;
  name: string;
  prompt: string;
  chatId: string | null;
}

/**
 * Constant-time string comparison (content-independent timing; length still
 * leaks, which is fine for random tokens).
 */
function secretsMatch(expected: string, provided: string): boolean {
  let diff = expected.length ^ provided.length;
  const len = Math.max(expected.length, provided.length);
  for (let i = 0; i < len; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

async function readPayload(req: Request): Promise<string> {
  const raw = (await req.text().catch(() => "")).trim();
  if (raw.length === 0) return "(empty body)";
  const clipped =
    raw.length > MAX_PAYLOAD_CHARS
      ? `${raw.slice(0, MAX_PAYLOAD_CHARS)}\n… (payload truncated)`
      : raw;
  try {
    return JSON.stringify(JSON.parse(clipped), null, 2);
  } catch {
    return clipped;
  }
}

function hookMessage(
  hook: TriggerRow,
  contentType: string | null,
  payload: string,
): string {
  return [
    `Your webhook "${hook.name}" (id ${hook.hookId}) just received an event. Your stored instruction for it:`,
    "",
    hook.prompt,
    "",
    `Payload${contentType !== null ? ` (${contentType})` : ""}:`,
    "```",
    payload,
    "```",
    "",
    "Carry out the instruction now and report the result. The user didn't just message you - this fired on its own, so lead with what this is about.",
  ].join("\n");
}

export default defineChannel({
  routes: [
    POST("/hooks/:hookId/:secret", async (req, { receive, params }) => {
      const convex = convexClient();
      const hook = (await convex.mutation(backend.triggersGet, {
        secret: serviceSecret(),
        hookId: params.hookId,
      })) as TriggerRow | null;
      // A single 404 for unknown id and bad secret, so probing reveals nothing.
      if (hook === null || !secretsMatch(hook.secret, params.secret)) {
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }

      const payload = await readPayload(req);
      const message = hookMessage(hook, req.headers.get("content-type"), payload);

      await convex.mutation(backend.triggersRecordFire, {
        secret: serviceSecret(),
        hookId: hook.hookId,
      });

      const auth = {
        authenticator: "webhook",
        principalType: "service" as const,
        principalId: `webhook:${hook.hookId}`,
        attributes: { webhook_id: hook.hookId, webhook_name: hook.name },
      };

      let session;
      if (hook.chatId !== null) {
        session = await receive(telegram, {
          message,
          target: { chatId: hook.chatId },
          auth,
        });
      } else {
        session = await receive(proactive, { message, target: {}, auth });
        await convex.mutation(backend.inboxAdd, {
          secret: serviceSecret(),
          sessionId: session.id,
          title: `Webhook: ${hook.name}`,
          kind: "webhook",
        });
      }

      // The turn itself runs durably on the world queue; the runner action
      // that dispatched this request marks the session system so it executes
      // on the deployment's own credentials.
      return new Response(JSON.stringify({ ok: true, sessionId: session.id }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
  ],
});
