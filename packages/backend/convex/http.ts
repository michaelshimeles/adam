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

/**
 * Telegram bot webhook (agent/channels/telegram.ts). Register with Telegram:
 *   setWebhook url=https://<deployment>.convex.site/channels/telegram
 *            secret_token=$TELEGRAM_WEBHOOK_SECRET_TOKEN
 * The eve channel verifies the secret token; this route just forwards.
 */
http.route({
  path: "/channels/telegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    if (body.length > 1_000_000) {
      return new Response("payload too large", { status: 413 });
    }
    const result = await ctx.runAction(
      internal.runner.channels.dispatchTelegram,
      {
        body,
        secretToken:
          request.headers.get("x-telegram-bot-api-secret-token") ?? undefined,
      },
    );
    return new Response(result.body, { status: result.status });
  }),
});

/**
 * Agent-created event triggers (agent/channels/hooks.ts):
 *   POST https://<deployment>.convex.site/hooks/<hookId>/<secret>
 * The channel verifies the secret against the `triggers` table.
 */
http.route({
  pathPrefix: "/hooks/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter((s) => s.length > 0);
    // ["hooks", hookId, secret]
    if (segments.length !== 3) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const body = await request.text();
    if (body.length > 64_000) {
      return new Response(JSON.stringify({ error: "body too large" }), {
        status: 413,
        headers: { "content-type": "application/json" },
      });
    }
    const result = await ctx.runAction(internal.runner.channels.dispatchHook, {
      hookId: segments[1],
      pathSecret: segments[2],
      body,
      contentType: request.headers.get("content-type") ?? undefined,
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
