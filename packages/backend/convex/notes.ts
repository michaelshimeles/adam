import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * The agent's durable team notepad (demo app data, not world state).
 *
 * Writes come from the eve agent's tools and carry the world service secret;
 * reads are public so the Svelte dashboard can subscribe live. Add real user
 * auth before shipping anything like this to production.
 */

const noteValidator = v.object({
  id: v.id("notes"),
  text: v.string(),
  author: v.string(),
  createdAt: v.number(),
});

export const add = mutation({
  args: {
    secret: v.string(),
    text: v.string(),
    author: v.string(),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await ctx.db.insert("notes", {
      text: args.text,
      author: args.author,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(noteValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);
    const rows = await ctx.db.query("notes").order("desc").take(limit);
    return rows.map((doc) => ({
      id: doc._id,
      text: doc.text,
      author: doc.author,
      createdAt: doc.createdAt,
    }));
  },
});

export const clear = mutation({
  args: { secret: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const rows = await ctx.db.query("notes").take(500);
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});
