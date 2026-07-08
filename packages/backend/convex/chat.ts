"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { loadEveBundle, type EveRouteEvent } from "./runner/bundle";

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
 * NOTE: like the rest of this demo deployment there is no end-user auth;
 * anyone with the deployment URL can talk to the agent. Add ctx.auth checks
 * before exposing this beyond a demo.
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
    /** Omit for a new session; pass the previous sessionId to continue. */
    sessionId: v.optional(v.string()),
    message: v.optional(v.string()),
    /** HITL answers: [{requestId, optionId?, text?}] */
    inputResponses: v.optional(v.array(v.any())),
    continuationToken: v.optional(v.string()),
  },
  returns: sendResult,
  handler: async (_ctx, args) => {
    const { bundle } = await loadEveBundle();

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

    // Channel handlers may defer work via waitUntil; a Convex action must
    // not return while that work is still running.
    await Promise.allSettled(background);

    const sessionId =
      (typeof json.sessionId === "string" ? json.sessionId : undefined) ??
      response.headers.get("x-eve-session-id") ??
      undefined;

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
  },
});
