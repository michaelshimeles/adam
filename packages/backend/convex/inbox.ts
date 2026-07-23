import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * Proactive-session inbox: rows written by the agent's proactive channel
 * (fired reminders, webhook events) so the dashboard can list agent-initiated
 * work. Transcripts render via the existing ui:sessionEvents query.
 */

export const add = mutation({
  args: {
    secret: v.string(),
    sessionId: v.string(),
    title: v.string(),
    kind: v.union(v.literal("reminder"), v.literal("webhook")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const existing = await ctx.db
      .query("inbox")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (existing === null) {
      await ctx.db.insert("inbox", {
        sessionId: args.sessionId,
        title: args.title,
        kind: args.kind,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      sessionId: v.string(),
      title: v.string(),
      kind: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const rows = await ctx.db.query("inbox").order("desc").take(limit);
    return rows.map((row) => ({
      sessionId: row.sessionId,
      title: row.title,
      kind: row.kind,
      createdAt: row.createdAt,
    }));
  },
});
