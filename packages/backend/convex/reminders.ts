import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * Application-managed reminders (eve's dynamic-scheduling pattern on
 * Convex): the agent's reminder tools CRUD rows here, and the minute-level
 * eve schedule (agent/schedules/reminders.ts, dispatched by a Convex cron)
 * claims due rows and runs one proactive session per reminder.
 *
 * Cron math (next occurrence in an IANA timezone) happens inside the eve
 * bundle, which has cron-parser; these functions only store what they are
 * given.
 */

const reminderValidator = v.object({
  id: v.id("reminders"),
  prompt: v.string(),
  cron: v.union(v.string(), v.null()),
  timezone: v.string(),
  nextFireAt: v.number(),
  chatId: v.union(v.string(), v.null()),
  status: v.string(),
  lastFiredAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
});

type ReminderDoc = {
  _id: import("./_generated/dataModel").Id<"reminders">;
  prompt: string;
  cron: string | null;
  timezone: string;
  nextFireAt: number;
  chatId: string | null;
  status: "active" | "done" | "cancelled";
  lastFiredAt?: number;
  createdAt: number;
};

function publicRow(row: ReminderDoc) {
  return {
    id: row._id,
    prompt: row.prompt,
    cron: row.cron,
    timezone: row.timezone,
    nextFireAt: row.nextFireAt,
    chatId: row.chatId,
    status: row.status,
    lastFiredAt: row.lastFiredAt ?? null,
    createdAt: row.createdAt,
  };
}

export const create = mutation({
  args: {
    secret: v.string(),
    prompt: v.string(),
    cron: v.union(v.string(), v.null()),
    timezone: v.string(),
    nextFireAt: v.number(),
    chatId: v.union(v.string(), v.null()),
  },
  returns: reminderValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const id = await ctx.db.insert("reminders", {
      prompt: args.prompt,
      cron: args.cron,
      timezone: args.timezone,
      nextFireAt: args.nextFireAt,
      chatId: args.chatId,
      status: "active",
      createdAt: Date.now(),
    });
    const row = await ctx.db.get(id);
    return publicRow(row as ReminderDoc);
  },
});

export const list = query({
  args: {},
  returns: v.array(reminderValidator),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("reminders")
      .withIndex("by_status_nextFireAt", (q) => q.eq("status", "active"))
      .take(200);
    return rows.map((row) => publicRow(row as ReminderDoc));
  },
});

export const cancel = mutation({
  args: { secret: v.string(), id: v.id("reminders") },
  returns: v.union(reminderValidator, v.null()),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db.get(args.id);
    if (row === null || row.status !== "active") return null;
    await ctx.db.patch(args.id, { status: "cancelled", claimedUntil: undefined });
    const updated = await ctx.db.get(args.id);
    return publicRow(updated as ReminderDoc);
  },
});

/**
 * Atomically claim due reminders. The lease keeps a crashed dispatch from
 * stranding a row: an unfinished claim expires and a later tick retries it.
 */
export const claimDue = mutation({
  args: {
    secret: v.string(),
    limit: v.optional(v.number()),
    leaseMs: v.optional(v.number()),
  },
  returns: v.array(reminderValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const now = Date.now();
    const limit = Math.min(args.limit ?? 10, 25);
    const leaseMs = args.leaseMs ?? 5 * 60_000;
    const due = await ctx.db
      .query("reminders")
      .withIndex("by_status_nextFireAt", (q) =>
        q.eq("status", "active").lte("nextFireAt", now),
      )
      .take(50);
    const claimed: ReminderDoc[] = [];
    for (const row of due) {
      if (claimed.length >= limit) break;
      if (row.claimedUntil !== undefined && row.claimedUntil > now) continue;
      await ctx.db.patch(row._id, { claimedUntil: now + leaseMs });
      claimed.push(row as ReminderDoc);
    }
    return claimed.map(publicRow);
  },
});

/** Mark a claimed reminder delivered: done for one-offs, advanced for cron. */
export const complete = mutation({
  args: {
    secret: v.string(),
    id: v.id("reminders"),
    /** Next occurrence for recurring reminders; omit for one-offs. */
    nextFireAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db.get(args.id);
    if (row === null) return null;
    if (args.nextFireAt !== undefined) {
      await ctx.db.patch(args.id, {
        nextFireAt: args.nextFireAt,
        lastFiredAt: Date.now(),
        claimedUntil: undefined,
      });
    } else {
      await ctx.db.patch(args.id, {
        status: "done",
        lastFiredAt: Date.now(),
        claimedUntil: undefined,
      });
    }
    return null;
  },
});

/** Release a claim after a delivery failure so a later tick retries it. */
export const release = mutation({
  args: { secret: v.string(), id: v.id("reminders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db.get(args.id);
    if (row !== null) await ctx.db.patch(args.id, { claimedUntil: undefined });
    return null;
  },
});
