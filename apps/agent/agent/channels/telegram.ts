import { defaultTelegramAuth, telegramChannel } from "eve/channels/telegram";

/**
 * Telegram DM channel. Credentials come from TELEGRAM_BOT_TOKEN and
 * TELEGRAM_WEBHOOK_SECRET_TOKEN (deployment env vars, set by the builder).
 * On Convex the route is exposed at
 * `POST https://<deployment>.convex.site/channels/telegram`
 * (convex/http.ts forwards into the bundle's channel dispatcher); register
 * it with Telegram via setWebhook.
 *
 * Personal-agent posture: only private DMs are answered, and when
 * TELEGRAM_ALLOWED_USER_IDS is set (comma-separated Telegram user ids),
 * only messages from those users. Everyone else is silently ignored.
 */
function allowedUserIds(): string[] {
  return (process.env.TELEGRAM_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export default telegramChannel({
  route: "/telegram",
  botUsername: process.env.TELEGRAM_BOT_USERNAME,
  async onMessage(ctx, message) {
    if (message.chat.type !== "private") return null;
    if (message.from?.isBot === true) return null;

    const allowlist = allowedUserIds();
    const fromId = message.from?.id;
    if (
      allowlist.length > 0 &&
      (fromId === undefined || !allowlist.includes(String(fromId)))
    ) {
      return null;
    }

    const hasContent =
      (message.text || message.caption).trim().length > 0 ||
      message.attachments.length > 0;
    if (!hasContent) return null;

    await ctx.telegram.startTyping();
    return { auth: defaultTelegramAuth(message) };
  },
  uploadPolicy: {
    allowedMediaTypes: ["image/*", "application/pdf"],
    maxBytes: 10 * 1024 * 1024,
  },
});
