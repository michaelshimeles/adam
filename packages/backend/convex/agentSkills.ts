import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * Chat-created skills: reusable procedures the agent writes for itself
 * (create_skill / delete_skill tools). The agent's dynamic instructions
 * fragment inlines every stored skill at session start.
 */

const skillValidator = v.object({
  name: v.string(),
  description: v.string(),
  markdown: v.string(),
  updatedAt: v.number(),
});

export const put = mutation({
  args: {
    secret: v.string(),
    name: v.string(),
    description: v.string(),
    markdown: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const existing = await ctx.db
      .query("agentSkills")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    const row = {
      name: args.name,
      description: args.description,
      markdown: args.markdown,
      updatedAt: Date.now(),
    };
    if (existing !== null) {
      await ctx.db.replace(existing._id, row);
    } else {
      await ctx.db.insert("agentSkills", row);
    }
    return null;
  },
});

export const remove = mutation({
  args: { secret: v.string(), name: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const existing = await ctx.db
      .query("agentSkills")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing === null) return false;
    await ctx.db.delete(existing._id);
    return true;
  },
});

export const list = query({
  args: {},
  returns: v.array(skillValidator),
  handler: async (ctx) => {
    const rows = await ctx.db.query("agentSkills").take(200);
    return rows
      .map((row) => ({
        name: row.name,
        description: row.description,
        markdown: row.markdown,
        updatedAt: row.updatedAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
