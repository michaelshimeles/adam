import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";
import { worldError } from "../lib/errors";
import { encStepValidator, paginatedValidator } from "../lib/validators";
import { encodeStep, getStepDoc } from "../lib/worldStore";

export const get = query({
  args: { secret: v.string(), runId: v.string(), stepId: v.string() },
  returns: encStepValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await getStepDoc(ctx, args.runId, args.stepId);
    if (!doc) {
      worldError("WORLD_ERROR", `Step not found: ${args.stepId}`);
    }
    return encodeStep(doc);
  },
});

export const list = query({
  args: {
    secret: v.string(),
    runId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: paginatedValidator(encStepValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const limit = args.limit ?? 20;
    // Steps are listed stepId-descending with a lt-cursor (world-postgres
    // parity).
    const all = await ctx.db
      .query("steps")
      .withIndex("by_run", (ix) => {
        const base = ix.eq("runId", args.runId);
        return args.cursor === undefined
          ? base
          : base.lt("stepId", args.cursor);
      })
      .order("desc")
      .take(limit + 1);
    const values = all.slice(0, limit);
    return {
      data: values.map(encodeStep),
      cursor: values.at(-1)?.stepId ?? null,
      hasMore: all.length > limit,
    };
  },
});
