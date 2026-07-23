"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { modelProviderValidator, normalizeProvider } from "./lib/modelKeys";
import { loadEveBundle, type EveRouteEvent } from "./runner/bundle";
import { deliverSessionInline } from "./runner/engine";
import { withModelKey } from "./runner/modelKeyLock";

/**
 * Chat entry point for the web UI — the Convex-native replacement for the
 * eve server's HTTP channel routes.
 *
 * Calls eve's channel dispatcher in-process with a fabricated loopback
 * request (accepted by the localDev auth strategy). The dispatcher creates
 * or continues the durable session run and enqueues the turn on the world
 * queue — which the queue mutations then hand to runner/engine:tick. The
 * response returns immediately with the session id; the UI watches the
 * session's event stream reactively via ui:sessionEvents.
 *
 * BYOK: the deployment is public, so every send must carry the caller's own
 * key — a Vercel AI Gateway key or an OpenRouter key. The key (and which
 * provider it belongs to) is recorded against the session's run id (keys
 * table) and runner/engine:tick injects it before executing that session's
 * jobs — model calls spend the visitor's credits, not the deployment's.
 * There is still no end-user auth beyond that; transcripts are demo-public.
 */

const sendResult = v.object({
  ok: v.boolean(),
  status: v.number(),
  sessionId: v.optional(v.string()),
  continuationToken: v.optional(v.string()),
  error: v.optional(v.string()),
});

export const send = action({
  args: {
    /** The caller's model API key — pays for this session's turns. */
    apiKey: v.string(),
    /** Which service issued apiKey; omitted means "gateway". */
    provider: v.optional(modelProviderValidator),
    /** Omit for a new session; pass the previous sessionId to continue. */
    sessionId: v.optional(v.string()),
    message: v.optional(v.string()),
    /** HITL answers: [{requestId, optionId?, text?}] */
    inputResponses: v.optional(v.array(v.any())),
    continuationToken: v.optional(v.string()),
    /**
     * One-turn client context, delivered by the eve channel as a
     * "Client context:\n<json>" user message. The web UI rides the selected
     * model along as { eveWebModel }; the agent's dynamic model resolver
     * picks it up (see agent/agent.ts).
     */
    clientContext: v.optional(v.any()),
  },
  returns: sendResult,
  handler: async (ctx, args) => {
    const apiKey = args.apiKey.trim();
    const provider = normalizeProvider(args.provider);
    if (!apiKey) {
      return {
        ok: false,
        status: 400,
        error:
          "An API key (Vercel AI Gateway or OpenRouter) is required to chat.",
      };
    }

    const { bundle } = await loadEveBundle(ctx);

    // Continuing a session: persist the key before the turn enqueues so the
    // runner can never claim the job first and find no key.
    if (args.sessionId) {
      await ctx.runMutation(internal.keys.put, {
        sessionId: args.sessionId,
        apiKey,
        provider,
      });
    }

    const body: Record<string, unknown> = {};
    if (args.message !== undefined) body.message = args.message;
    if (args.clientContext !== undefined) body.clientContext = args.clientContext;
    if (args.inputResponses !== undefined && args.inputResponses.length > 0) {
      body.inputResponses = args.inputResponses;
    }
    if (args.continuationToken !== undefined) {
      body.continuationToken = args.continuationToken;
    }

    const routeKey = args.sessionId
      ? "POST /eve/v1/session/:sessionId"
      : "POST /eve/v1/session";
    const path = args.sessionId
      ? `/eve/v1/session/${encodeURIComponent(args.sessionId)}`
      : "/eve/v1/session";

    const request = new Request(`http://127.0.0.1${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const background: Promise<unknown>[] = [];
    const event: EveRouteEvent = {
      req: request,
      context: {
        params: args.sessionId
          ? { sessionId: encodeURIComponent(args.sessionId) }
          : {},
      },
      waitUntil: (p) => {
        background.push(p);
      },
    };

    // Cover any model use inside the channel dispatch itself with the
    // caller's key. withModelKey serializes credential injection
    // process-wide, so this can neither clobber nor be clobbered by a
    // concurrent runner delivery's injected key.
    const result = await withModelKey({ provider, apiKey }, async () => {
      const response = await bundle.dispatchChannelRequest(event, routeKey, {
        dev: false,
      });
      const text = await response.text();
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // non-JSON error body; surfaced via `error` below
      }

      const sessionId =
        (typeof json.sessionId === "string" ? json.sessionId : undefined) ??
        response.headers.get("x-eve-session-id") ??
        undefined;

      // New session: the first turn's job is already enqueued, so record the
      // key immediately. The runner briefly releases jobs whose key hasn't
      // landed yet (see runner/engine.ts), which closes the race window.
      if (!args.sessionId && sessionId) {
        await ctx.runMutation(internal.keys.put, { sessionId, apiKey, provider });
      }

      // Channel handlers may defer work via waitUntil; a Convex action must
      // not return while that work is still running.
      await Promise.allSettled(background);

      return {
        ok: response.ok,
        status: response.status,
        sessionId,
        continuationToken:
          typeof json.continuationToken === "string"
            ? json.continuationToken
            : undefined,
        error: response.ok
          ? undefined
          : ((typeof json.error === "string" ? json.error : undefined) ??
            text.slice(0, 500)),
      };
    });

    // Fast path: this action already paid the cold start and bundle load,
    // so deliver the turn's jobs here instead of waiting for a scheduled
    // runner tick (a fresh action spawn). Tokens stream to the `streams`
    // table as the turn runs, so the UI renders live either way; if this
    // action dies mid-turn, leases expire and the ticks recover the jobs.
    // Outside the withModelKey section above — the mutex is not reentrant;
    // the inline runner wraps each delivery batch itself.
    if (result.ok && result.sessionId) {
      // Optimization only: the turn is already durably enqueued and every
      // enqueue scheduled a runner tick, so a failure here must not turn an
      // already-successful send into a client-visible error (which could
      // prompt a resend and a duplicate billed turn). The ticks take over.
      try {
        if (args.sessionId) {
          // Continuing chat: the client is already subscribed to
          // ui:sessionEvents, so deliver in-process on this warm isolate.
          await deliverSessionInline(
            ctx,
            bundle,
            { provider, apiKey },
            result.sessionId,
          );
        } else {
          // New chat: the client needs this response's sessionId to
          // subscribe before it can render anything, so return now and
          // run the inline delivery in an immediately-scheduled action.
          // Only the session id crosses the scheduler (its args persist in
          // a system table); the action re-reads the key from sessionKeys,
          // where it was committed above.
          await ctx.scheduler.runAfter(
            0,
            internal.runner.engine.inlineSession,
            { sessionId: result.sessionId },
          );
        }
      } catch (error) {
        console.error("inline delivery failed; scheduled ticks recover", error);
      }
    }

    return result;
  },
});
