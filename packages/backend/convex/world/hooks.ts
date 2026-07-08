import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";
import { worldError } from "../lib/errors";
import { encHookValidator, paginatedValidator } from "../lib/validators";
import {
  encodeHook,
  getHookDocById,
  getHookDocByToken,
} from "../lib/worldStore";

export const get = query({
  args: { secret: v.string(), hookId: v.string() },
  returns: encHookValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await getHookDocById(ctx, args.hookId);
    if (!doc) {
      worldError("HOOK_NOT_FOUND", `Hook not found: ${args.hookId}`);
    }
    return encodeHook(doc);
  },
});

export const getByToken = query({
  args: { secret: v.string(), token: v.string() },
  returns: encHookValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await getHookDocByToken(ctx, args.token);
    if (!doc) {
      worldError("HOOK_NOT_FOUND", `Hook not found: ${args.token}`);
    }
    return encodeHook(doc);
  },
});

export const list = query({
  args: {
    secret: v.string(),
    runId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: paginatedValidator(encHookValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const limit = args.limit ?? 100;
    const sortOrder = args.sortOrder ?? "asc";

    let all;
    if (args.runId !== undefined) {
      all = await ctx.db
        .query("hooks")
        .withIndex("by_run", (ix) => {
          const base = ix.eq("runId", args.runId!);
          if (args.cursor === undefined) return base;
          return sortOrder === "asc"
            ? base.gt("hookId", args.cursor)
            : base.lt("hookId", args.cursor);
        })
        .order(sortOrder)
        .take(limit + 1);
    } else {
      all = await ctx.db
        .query("hooks")
        .withIndex("by_hookId", (ix) => {
          if (args.cursor === undefined) return ix;
          return sortOrder === "asc"
            ? ix.gt("hookId", args.cursor)
            : ix.lt("hookId", args.cursor);
        })
        .order(sortOrder)
        .take(limit + 1);
    }

    const values = all.slice(0, limit);
    return {
      data: values.map(encodeHook),
      cursor: values.at(-1)?.hookId ?? null,
      hasMore: all.length > limit,
    };
  },
});
