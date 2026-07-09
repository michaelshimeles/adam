"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { loadEveBundle, type EveRouteEvent } from "./runner/bundle";
import { withGatewayKey } from "./runner/gatewayKeyLock";

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
 * AI Gateway key. The key is recorded against the session's run id (keys
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
    /** The caller's Vercel AI Gateway key — pays for this session's turns. */
    apiKey: v.string(),
    /** Omit for a new session; pass the previous sessionId to continue. */
    sessionId: v.optional(v.string()),
    message: v.optional(v.string()),
    /** HITL answers: [{requestId, optionId?, text?}] */
    inputResponses: v.optional(v.array(v.any())),
    continuationToken: v.optional(v.string()),
  },
  returns: sendResult,
  handler: async (ctx, args) => {
    const apiKey = args.apiKey.trim();
    if (!apiKey) {
      return {
        ok: false,
        status: 400,
        error: "An AI Gateway API key is required to chat.",
      };
    }

    const { bundle } = await loadEveBundle();

    // Continuing a session: persist the key before the turn enqueues so the
    // runner can never claim the job first and find no key.
    if (args.sessionId) {
      await ctx.runMutation(internal.keys.put, {
        sessionId: args.sessionId,
        apiKey,
      });
    }

    const body: Record<string, unknown> = {};
    if (args.message !== undefined) body.message = args.message;
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
    // caller's key. withGatewayKey serializes gateway-key env access
    // process-wide, so this can neither clobber nor be clobbered by a
    // concurrent runner delivery's injected key.
    return await withGatewayKey(apiKey, async () => {
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
        await ctx.runMutation(internal.keys.put, { sessionId, apiKey });
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
  },
});
