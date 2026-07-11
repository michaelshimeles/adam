import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { httpAction } from "./_generated/server";
import { components, internal } from "./_generated/api";

const http = httpRouter();

/**
 * Inbound webhook channel (agent/channels/webhook.ts in the eve project).
 *
 *   POST https://<deployment>.convex.site/channels/webhook
 *   x-webhook-secret: <WEBHOOK_CHANNEL_SECRET>
 *   { "message": "...", "conversationId"?: "...", "replyUrl"?: "..." }
 *
 * The HTTP action runs in the default runtime (no Node APIs), so it forwards
 * into the node action that hosts the eve bundle.
 */
http.route({
  path: "/channels/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    if (body.length > 64_000) {
      return new Response(JSON.stringify({ error: "body too large" }), {
        status: 413,
        headers: { "content-type": "application/json" },
      });
    }
    const result = await ctx.runAction(internal.runner.channels.dispatchWebhook, {
      body,
      secret: request.headers.get("x-webhook-secret") ?? undefined,
    });
    return new Response(result.body, {
      status: result.status,
      headers: { "content-type": "application/json" },
    });
  }),
});

// Serve the built Svelte app (apps/web) from Convex file storage.
// Upload with `pnpm deploy:web` (build + upload) from the repo root.
registerStaticRoutes(http, components.selfHosting, { spaFallback: true });

export default http;
