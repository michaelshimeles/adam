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

/**
 * Decode one workflow stream frame into a session event JSON line.
 *
 * Session event streams are written by eve as serde-framed devalue payloads:
 *   [4-byte BE payload length][4-byte format magic "devl"][devalue JSON]
 * where the devalue value is a Uint8Array holding one NDJSON-encoded
 * HandleMessageStreamEvent line. Decoding server-side keeps the client free
 * of binary handling and the devalue dependency.
 *
 * The event is returned as its JSON string, not a structured object: tool
 * payloads inside events carry arbitrary JSON (Composio's connection_search
 * returns JSON Schemas full of "$schema"/"$ref" keys), and field names like
 * those are reserved in Convex values — returning them structured throws.
 * The client JSON.parses each line instead.
 */
function decodeSessionEventFrame(buf: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buf);
  if (bytes.length < 8) return null;
  const magic = String.fromCharCode(
    bytes[4]!,
    bytes[5]!,
    bytes[6]!,
    bytes[7]!,
  );
  if (magic !== "devl") return null;
  try {
    const flat = JSON.parse(new TextDecoder().decode(bytes.subarray(8))) as
      | unknown[]
      | unknown;
    if (!Array.isArray(flat) || flat.length < 2) return null;
    const head = flat[0];
    if (!Array.isArray(head) || head[0] !== "Uint8Array") return null;
    const b64 = flat[head[1] as number];
    if (typeof b64 !== "string") return null;
    // "." is devalue's encoding of an empty byte array
    if (b64 === ".") return null;
    const bin = atob(b64);
    const raw = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) raw[i] = bin.charCodeAt(i);
    const text = new TextDecoder().decode(raw);
    JSON.parse(text); // malformed frames are dropped, not returned
    return text;
  } catch {
    return null;
  }
}

/**
 * Reactive tail of a chat session's event stream. Each entry is one
 * HandleMessageStreamEvent as a JSON string (see decodeSessionEventFrame for
 * why they aren't returned structured); the chat UI subscribes and parses.
 * Every token append lands here via Convex reactivity, no SSE connection
 * needed.
 */
export const sessionEvents = query({
  args: {
    sessionId: v.string(),
    /** Read events with seq >= startSeq (window very long sessions) */
    startSeq: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      events: v.array(v.string()),
      nextSeq: v.number(),
      done: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (!args.sessionId.startsWith("wrun_")) return null;
    // eve names the session event stream strm_<id>_user on the session run
    const name = `${args.sessionId.replace("wrun_", "strm_")}_user`;
    const streamId = `${args.sessionId}/${name}`;
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
      .take(500);
    const events: string[] = [];
    let nextSeq = start;
    for (const row of rows) {
      const event = decodeSessionEventFrame(row.data);
      if (event !== null) events.push(event);
      nextSeq = row.seq + 1;
    }
    return { events, nextSeq, done: meta.done };
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
