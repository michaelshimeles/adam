"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { loadEveBundle, type EveRouteEvent } from "./bundle";
import { OWNER, withModelKey } from "./modelKeyLock";

/**
 * Bridge from Convex HTTP actions (convex/http.ts) into the eve bundle's
 * channel dispatcher, for channels beyond the web chat (chat.ts).
 *
 * The webhook channel (agent/channels/webhook.ts) authenticates with the
 * WEBHOOK_CHANNEL_SECRET deployment env var; sessions it starts are
 * deployment-initiated, so they are marked `system` here and run on the
 * deployment's own credentials (AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN,
 * else OPENROUTER_API_KEY) — external callers never supply a model
 * credential (unlike the BYOK web chat).
 */

export const dispatchWebhook = internalAction({
  args: {
    /** Raw JSON request body, forwarded verbatim. */
    body: v.string(),
    /** x-webhook-secret header from the caller, if present. */
    secret: v.optional(v.string()),
  },
  returns: v.object({ status: v.number(), body: v.string() }),
  handler: async (ctx, args) => {
    const { bundle } = await loadEveBundle(ctx);

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (args.secret !== undefined) headers["x-webhook-secret"] = args.secret;

    const background: Promise<unknown>[] = [];
    const event: EveRouteEvent = {
      req: new Request("http://127.0.0.1/webhook", {
        method: "POST",
        headers,
        body: args.body,
      }),
      context: { params: {} },
      waitUntil: (p) => {
        background.push(p);
      },
    };

    let response: Response;
    try {
      response = await withModelKey(OWNER, () =>
        bundle.dispatchChannelRequest(event, "POST /webhook", { dev: false }),
      );
    } catch (err) {
      // Most likely: this agent was built without agent/channels/webhook.ts.
      const message = String(err).slice(0, 300);
      return {
        status: 404,
        body: JSON.stringify({
          error: `webhook channel is not enabled for this agent (${message})`,
        }),
      };
    }

    const text = await response.text();

    // Mark the session system BEFORE the runner delivers its first job (the
    // runner briefly releases jobs whose key row is missing, so this lands
    // in time; see runner/engine.ts partitionByKey).
    if (response.ok) {
      try {
        const json = JSON.parse(text) as { sessionId?: unknown };
        if (typeof json.sessionId === "string") {
          await ctx.runMutation(internal.keys.markSystem, {
            sessionId: json.sessionId,
          });
        }
      } catch {
        // non-JSON success body — nothing to mark
      }
    }

    await Promise.allSettled(background);
    return { status: response.status, body: text };
  },
});

/**
 * Agent-created event triggers (agent/channels/hooks.ts): the channel route
 * verifies the path secret against the Convex `triggers` table, so this
 * bridge just forwards the request. Sessions it starts are proactive and
 * run on deployment credentials.
 */
export const dispatchHook = internalAction({
  args: {
    hookId: v.string(),
    pathSecret: v.string(),
    body: v.string(),
    contentType: v.optional(v.string()),
  },
  returns: v.object({ status: v.number(), body: v.string() }),
  handler: async (ctx, args) => {
    const { bundle } = await loadEveBundle(ctx);

    const headers: Record<string, string> = {};
    if (args.contentType !== undefined)
      headers["content-type"] = args.contentType;

    const background: Promise<unknown>[] = [];
    const event: EveRouteEvent = {
      req: new Request(
        `http://127.0.0.1/hooks/${encodeURIComponent(args.hookId)}/${encodeURIComponent(args.pathSecret)}`,
        { method: "POST", headers, body: args.body },
      ),
      context: {
        params: { hookId: args.hookId, secret: args.pathSecret },
      },
      waitUntil: (p) => {
        background.push(p);
      },
    };

    let response: Response;
    try {
      response = await withModelKey(OWNER, () =>
        bundle.dispatchChannelRequest(event, "POST /hooks/:hookId/:secret", {
          dev: false,
        }),
      );
    } catch (err) {
      const message = String(err).slice(0, 300);
      return {
        status: 404,
        body: JSON.stringify({
          error: `event triggers are not enabled for this agent (${message})`,
        }),
      };
    }

    const text = await response.text();
    if (response.ok) {
      try {
        const json = JSON.parse(text) as { sessionId?: unknown };
        if (typeof json.sessionId === "string") {
          await ctx.runMutation(internal.keys.markSystem, {
            sessionId: json.sessionId,
          });
        }
      } catch {
        // non-JSON success body — nothing to mark
      }
    }

    await Promise.allSettled(background);
    return { status: response.status, body: text };
  },
});

/**
 * Telegram channel (agent/channels/telegram.ts). The channel itself verifies
 * X-Telegram-Bot-Api-Secret-Token against TELEGRAM_WEBHOOK_SECRET_TOKEN. Its
 * handler acks with a bare "ok" (no session id), so Telegram sessions are
 * covered by the RUNNER_SYSTEM_KEY_FALLBACK env flag (runner/engine.ts)
 * rather than per-session markSystem.
 */
export const dispatchTelegram = internalAction({
  args: {
    body: v.string(),
    secretToken: v.optional(v.string()),
  },
  returns: v.object({ status: v.number(), body: v.string() }),
  handler: async (ctx, args) => {
    const { bundle } = await loadEveBundle(ctx);

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (args.secretToken !== undefined)
      headers["x-telegram-bot-api-secret-token"] = args.secretToken;

    const background: Promise<unknown>[] = [];
    const event: EveRouteEvent = {
      req: new Request("http://127.0.0.1/telegram", {
        method: "POST",
        headers,
        body: args.body,
      }),
      context: { params: {} },
      waitUntil: (p) => {
        background.push(p);
      },
    };

    let response: Response;
    try {
      response = await withModelKey(OWNER, () =>
        bundle.dispatchChannelRequest(event, "POST /telegram", { dev: false }),
      );
    } catch (err) {
      const message = String(err).slice(0, 300);
      return {
        status: 404,
        body: JSON.stringify({
          error: `telegram channel is not enabled for this agent (${message})`,
        }),
      };
    }

    const text = await response.text();
    await Promise.allSettled(background);
    return { status: response.status, body: text };
  },
});
