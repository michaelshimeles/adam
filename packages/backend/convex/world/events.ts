import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";
import { worldError } from "../lib/errors";
import {
  encEventValidator,
  eventResultValidator,
  paginatedValidator,
} from "../lib/validators";
import { createEventImpl, encodeEvent } from "../lib/worldStore";

/**
 * Event log API — the single write entrypoint of the event-sourced world.
 * Called by the eve host through the world-convex client.
 */

export const create = mutation({
  args: {
    secret: v.string(),
    runId: v.union(v.string(), v.null()),
    eventType: v.string(),
    correlationId: v.optional(v.string()),
    eventDataJson: v.optional(v.string()),
    specVersion: v.optional(v.number()),
    worldSpecVersion: v.number(),
    skipPreload: v.optional(v.boolean()),
  },
  returns: eventResultValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await createEventImpl(ctx, {
      runId: args.runId,
      eventType: args.eventType,
      correlationId: args.correlationId,
      eventDataJson: args.eventDataJson,
      specVersion: args.specVersion,
      worldSpecVersion: args.worldSpecVersion,
      skipPreload: args.skipPreload,
    });
  },
});

export const get = query({
  args: {
    secret: v.string(),
    runId: v.string(),
    eventId: v.string(),
  },
  returns: encEventValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await ctx.db
      .query("events")
      .withIndex("by_run", (q) =>
        q.eq("runId", args.runId).eq("eventId", args.eventId),
      )
      .unique();
    if (!doc) {
      worldError("WORLD_ERROR", `Event not found: ${args.eventId}`);
    }
    return encodeEvent(doc);
  },
});

export const list = query({
  args: {
    secret: v.string(),
    runId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: paginatedValidator(encEventValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const limit = args.limit ?? 100;
    const sortOrder = args.sortOrder ?? "asc";
    let q = ctx.db
      .query("events")
      .withIndex("by_run", (ix) => {
        const base = ix.eq("runId", args.runId);
        if (args.cursor === undefined) return base;
        return sortOrder === "asc"
          ? base.gt("eventId", args.cursor)
          : base.lt("eventId", args.cursor);
      })
      .order(sortOrder);
    const all = await q.take(limit + 1);
    const values = all.slice(0, limit);
    return {
      data: values.map(encodeEvent),
      cursor: values.at(-1)?.eventId ?? null,
      hasMore: all.length > limit,
    };
  },
});

export const listByCorrelationId = query({
  args: {
    secret: v.string(),
    correlationId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: paginatedValidator(encEventValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const limit = args.limit ?? 100;
    const sortOrder = args.sortOrder ?? "asc";
    const all = await ctx.db
      .query("events")
      .withIndex("by_correlation", (ix) => {
        const base = ix.eq("correlationId", args.correlationId);
        if (args.cursor === undefined) return base;
        return sortOrder === "asc"
          ? base.gt("eventId", args.cursor)
          : base.lt("eventId", args.cursor);
      })
      .order(sortOrder)
      .take(limit + 1);
    const values = all.slice(0, limit);
    return {
      data: values.map(encodeEvent),
      cursor: values.at(-1)?.eventId ?? null,
      hasMore: all.length > limit,
    };
  },
});
