import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";
import {
  applyAttributeChanges,
  validateAttributeChanges,
} from "../lib/attrs";
import { worldError } from "../lib/errors";
import { encRunValidator, paginatedValidator } from "../lib/validators";
import { encodeRun, getRunDoc } from "../lib/worldStore";

export const get = query({
  args: { secret: v.string(), runId: v.string() },
  returns: encRunValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await getRunDoc(ctx, args.runId);
    if (!doc) {
      worldError("RUN_NOT_FOUND", `Workflow run "${args.runId}" not found`);
    }
    return encodeRun(doc);
  },
});

export const list = query({
  args: {
    secret: v.string(),
    workflowName: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: paginatedValidator(encRunValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const limit = args.limit ?? 20;
    const status = args.status as
      | "pending"
      | "running"
      | "completed"
      | "failed"
      | "cancelled"
      | undefined;

    // Runs are listed newest-first (runId is a ULID, so runId desc ≈ time
    // desc), using the most specific index available for the filters.
    let all;
    if (args.workflowName !== undefined && status !== undefined) {
      all = await ctx.db
        .query("runs")
        .withIndex("by_workflow_status", (ix) => {
          const base = ix
            .eq("workflowName", args.workflowName!)
            .eq("status", status);
          return args.cursor === undefined
            ? base
            : base.lt("runId", args.cursor);
        })
        .order("desc")
        .take(limit + 1);
    } else if (args.workflowName !== undefined) {
      all = await ctx.db
        .query("runs")
        .withIndex("by_workflowName", (ix) => {
          const base = ix.eq("workflowName", args.workflowName!);
          return args.cursor === undefined
            ? base
            : base.lt("runId", args.cursor);
        })
        .order("desc")
        .take(limit + 1);
    } else if (status !== undefined) {
      all = await ctx.db
        .query("runs")
        .withIndex("by_status", (ix) => {
          const base = ix.eq("status", status);
          return args.cursor === undefined
            ? base
            : base.lt("runId", args.cursor);
        })
        .order("desc")
        .take(limit + 1);
    } else {
      all = await ctx.db
        .query("runs")
        .withIndex("by_runId", (ix) =>
          args.cursor === undefined ? ix : ix.lt("runId", args.cursor),
        )
        .order("desc")
        .take(limit + 1);
    }

    const values = all.slice(0, limit);
    return {
      data: values.map(encodeRun),
      cursor: values.at(-1)?.runId ?? null,
      hasMore: all.length > limit,
    };
  },
});

export const setAttributes = mutation({
  args: {
    secret: v.string(),
    runId: v.string(),
    changes: v.array(
      v.object({ key: v.string(), value: v.union(v.string(), v.null()) }),
    ),
    allowReservedAttributes: v.optional(v.boolean()),
  },
  returns: v.object({ attributesJson: v.string() }),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await getRunDoc(ctx, args.runId);
    if (!doc) {
      worldError("RUN_NOT_FOUND", `Workflow run "${args.runId}" not found`);
    }
    const existing = JSON.parse(doc.attributesJson) as Record<string, string>;
    validateAttributeChanges(args.changes, {
      existingKeys: Object.keys(existing),
      allowReservedAttributes: args.allowReservedAttributes === true,
    });
    const merged = applyAttributeChanges(existing, args.changes);
    const attributesJson = JSON.stringify(merged);
    await ctx.db.patch(doc._id, { attributesJson, updatedAt: Date.now() });
    return { attributesJson };
  },
});
