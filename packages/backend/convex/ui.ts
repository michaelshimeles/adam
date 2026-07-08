import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Public read-only queries for the Svelte UI (convex-svelte).
 *
 * These power the live observability surface: run list, run detail
 * (steps/events/hooks), and live agent output streams — all reactive.
 *
 * NOTE: this demo deployment has no end-user auth; anyone with the
 * deployment URL can read workflow metadata. Payload-bearing fields are
 * NOT exposed here except for stream chunks (the agent's user-facing
 * output). Add auth (ctx.auth) before using this in production.
 */

const uiRunValidator = v.object({
  runId: v.string(),
  status: v.string(),
  workflowName: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  errorCode: v.optional(v.string()),
});

export const listRuns = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(uiRunValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const rows = await ctx.db
      .query("runs")
      .withIndex("by_runId")
      .order("desc")
      .take(limit);
    return rows.map((doc) => ({
      runId: doc.runId,
      status: doc.status,
      workflowName: doc.workflowName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      errorCode: doc.errorCode,
    }));
  },
});

export const getRun = query({
  args: { runId: v.string() },
  returns: v.union(uiRunValidator, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("runs")
      .withIndex("by_runId", (q) => q.eq("runId", args.runId))
      .unique();
    if (!doc) return null;
    return {
      runId: doc.runId,
      status: doc.status,
      workflowName: doc.workflowName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      errorCode: doc.errorCode,
    };
  },
});

export const listSteps = query({
  args: { runId: v.string() },
  returns: v.array(
    v.object({
      stepId: v.string(),
      stepName: v.string(),
      status: v.string(),
      attempt: v.number(),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("steps")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .order("asc")
      .take(200);
    return rows.map((doc) => ({
      stepId: doc.stepId,
      stepName: doc.stepName,
      status: doc.status,
      attempt: doc.attempt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      createdAt: doc.createdAt,
    }));
  },
});

export const listEvents = query({
  args: { runId: v.string() },
  returns: v.array(
    v.object({
      eventId: v.string(),
      eventType: v.string(),
      correlationId: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("events")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .order("asc")
      .take(500);
    return rows.map((doc) => ({
      eventId: doc.eventId,
      eventType: doc.eventType,
      correlationId: doc.correlationId,
      createdAt: doc.createdAt,
    }));
  },
});

/** Live streams attached to a run (agent output is streamed per session). */
export const listRunStreams = query({
  args: { runId: v.string() },
  returns: v.array(
    v.object({
      name: v.string(),
      dataCount: v.number(),
      done: v.boolean(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("streams")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .take(50);
    return rows.map((doc) => ({
      name: doc.name,
      dataCount: doc.dataCount,
      done: doc.done,
      updatedAt: doc.updatedAt,
    }));
  },
});

/**
 * Reactive tail of a stream, decoded as UTF-8 text.
 *
 * The UI subscribes to this to render live agent output. Chunk data is
 * concatenated server-side (bounded window) so the client doesn't need
 * binary handling.
 */
export const streamText = query({
  args: {
    runId: v.string(),
    name: v.string(),
    /** Read chunks with seq >= startSeq (for windowing long streams) */
    startSeq: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      text: v.string(),
      nextSeq: v.number(),
      done: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const streamId = `${args.runId}/${args.name}`;
    const meta = await ctx.db
      .query("streams")
      .withIndex("by_streamId", (q) => q.eq("streamId", streamId))
      .unique();
    if (!meta) return null;
    const start = args.startSeq ?? 0;
    const rows = await ctx.db
      .query("streamChunks")
      .withIndex("by_stream", (q) =>
        q.eq("streamId", streamId).gte("seq", start),
      )
      .order("asc")
      .take(200);
    const decoder = new TextDecoder();
    let text = "";
    let nextSeq = start;
    for (const row of rows) {
      text += decoder.decode(row.data, { stream: true });
      nextSeq = row.seq + 1;
    }
    return { text, nextSeq, done: meta.done };
  },
});

/** Dead / failing queue jobs for the ops panel. */
export const queueHealth = query({
  args: {},
  returns: v.object({
    pending: v.number(),
    claimed: v.number(),
    dead: v.number(),
  }),
  handler: async (ctx) => {
    const [pending, claimed, dead] = await Promise.all([
      ctx.db
        .query("queueJobs")
        .withIndex("by_state_runAfter", (q) => q.eq("state", "pending"))
        .take(100),
      ctx.db
        .query("queueJobs")
        .withIndex("by_state_runAfter", (q) => q.eq("state", "claimed"))
        .take(100),
      ctx.db
        .query("queueJobs")
        .withIndex("by_state_runAfter", (q) => q.eq("state", "dead"))
        .take(100),
    ]);
    return {
      pending: pending.length,
      claimed: claimed.length,
      dead: dead.length,
    };
  },
});
