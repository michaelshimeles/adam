import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

/**
 * Direct Convex access for authored tools. This is the same deployment that
 * backs the workflow world, so agent data (notes, memories, skills,
 * reminders, webhooks, receipts) and durable run state live side by side
 * and the dashboard reads both reactively.
 */

export function convexClient(): ConvexHttpClient {
  const url = process.env.CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

export function serviceSecret(): string {
  const secret = process.env.WORLD_SERVICE_SECRET;
  if (!secret) throw new Error("WORLD_SERVICE_SECRET is not set");
  return secret;
}

/** Untyped function refs (the backend package owns the real types). */
export const backend = {
  notesAdd: anyApi.notes.add,
  notesList: anyApi.notes.list,
  notesClear: anyApi.notes.clear,
  queueHealth: anyApi.ui.queueHealth,
  listRuns: anyApi.ui.listRuns,
  memoriesAdd: anyApi.memories.add,
  memoriesRemove: anyApi.memories.remove,
  memoriesSearch: anyApi.memories.search,
  memoriesList: anyApi.memories.list,
  memoriesProfile: anyApi.memories.profile,
  skillsPut: anyApi.agentSkills.put,
  skillsRemove: anyApi.agentSkills.remove,
  skillsList: anyApi.agentSkills.list,
  remindersCreate: anyApi.reminders.create,
  remindersList: anyApi.reminders.list,
  remindersCancel: anyApi.reminders.cancel,
  remindersClaimDue: anyApi.reminders.claimDue,
  remindersComplete: anyApi.reminders.complete,
  remindersRelease: anyApi.reminders.release,
  triggersCreate: anyApi.triggers.create,
  triggersListFull: anyApi.triggers.listFull,
  triggersGet: anyApi.triggers.get,
  triggersRemove: anyApi.triggers.remove,
  triggersRecordFire: anyApi.triggers.recordFire,
  receiptsLog: anyApi.receipts.log,
  receiptsRemove: anyApi.receipts.remove,
  receiptsListRange: anyApi.receipts.listRange,
  receiptsSummary: anyApi.receipts.summary,
  inboxAdd: anyApi.inbox.add,
};

/** The default IANA timezone for reminders and time rendering. */
export function defaultTimezone(): string {
  return process.env.AGENT_DEFAULT_TIMEZONE || "UTC";
}

/** Telegram chat id from a session's auth attributes, or null. */
export function telegramChatId(
  attributes: Record<string, unknown>,
): string | null {
  const chatId = attributes.chat_id;
  return chatId === undefined || chatId === null ? null : String(chatId);
}

/** Public URL of a minted webhook endpoint on this deployment. */
export function triggerUrl(hook: { hookId: string; secret: string }): string {
  // Convex HTTP routes live on the site URL (.convex.site in the cloud,
  // port 3211 on a local anonymous deployment) rather than the API URL.
  const siteUrl = process.env.CONVEX_SITE_URL;
  const base =
    siteUrl ??
    (process.env.CONVEX_URL ?? "").replace(".convex.cloud", ".convex.site");
  return `${base}/hooks/${hook.hookId}/${hook.secret}`;
}
