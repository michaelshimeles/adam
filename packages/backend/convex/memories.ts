import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * Long-term memory, Convex-native (the eve-agents reference used
 * Supermemory). Writes come from the agent's memory tools with the world
 * service secret; reads are public so the dashboard can subscribe live.
 *
 * The "profile" injected into each session is simply every permanent memory
 * plus the most recent non-permanent ones; the nightly consolidation
 * schedule keeps that set small and high-signal.
 */

const memoryValidator = v.object({
  id: v.id("memories"),
  content: v.string(),
  permanent: v.boolean(),
  updatedAt: v.number(),
});

const PROFILE_RECENT_LIMIT = 30;

export const add = mutation({
  args: {
    secret: v.string(),
    content: v.string(),
    permanent: v.boolean(),
  },
  returns: v.id("memories"),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const now = Date.now();
    return await ctx.db.insert("memories", {
      content: args.content,
      permanent: args.permanent,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { secret: v.string(), id: v.id("memories") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db.get(args.id);
    if (row === null) return false;
    await ctx.db.delete(args.id);
    return true;
  },
});

export const search = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  returns: v.array(memoryValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 50);
    const rows = await ctx.db
      .query("memories")
      .withSearchIndex("search_content", (q) => q.search("content", args.query))
      .take(limit);
    return rows.map((row) => ({
      id: row._id,
      content: row.content,
      permanent: row.permanent,
      updatedAt: row.updatedAt,
    }));
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(memoryValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 500);
    const rows = await ctx.db.query("memories").order("desc").take(limit);
    return rows.map((row) => ({
      id: row._id,
      content: row.content,
      permanent: row.permanent,
      updatedAt: row.updatedAt,
    }));
  },
});

/** Stable facts + recent context, injected into every session's instructions. */
export const profile = query({
  args: {},
  returns: v.object({
    permanent: v.array(v.string()),
    recent: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const permanent = await ctx.db
      .query("memories")
      .withIndex("by_permanent", (q) => q.eq("permanent", true))
      .order("desc")
      .take(100);
    const recent = await ctx.db
      .query("memories")
      .withIndex("by_permanent", (q) => q.eq("permanent", false))
      .order("desc")
      .take(PROFILE_RECENT_LIMIT);
    return {
      permanent: permanent.map((row) => row.content),
      recent: recent.map((row) => row.content),
    };
  },
});
