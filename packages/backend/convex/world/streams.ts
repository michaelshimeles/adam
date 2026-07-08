import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";
import { worldError } from "../lib/errors";

/**
 * Stream storage backing the world-convex Streamer.
 *
 * A stream is identified by `${runId}/${name}`. Chunks are binary rows with
 * a 0-based `seq`; the `streams` meta row carries `dataCount`/`done` and is
 * the reactive subscription target for live readers (subscribe to meta,
 * page in new chunks non-reactively as dataCount grows).
 */

function streamKey(runId: string, name: string): string {
  return `${runId}/${name}`;
}

export const writeChunks = mutation({
  args: {
    secret: v.string(),
    runId: v.string(),
    name: v.string(),
    chunks: v.array(v.bytes()),
    /** Close the stream after appending these chunks */
    eof: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const now = Date.now();
    const streamId = streamKey(args.runId, args.name);
    let meta = await ctx.db
      .query("streams")
      .withIndex("by_streamId", (q) => q.eq("streamId", streamId))
      .unique();
    if (!meta) {
      const id = await ctx.db.insert("streams", {
        streamId,
        runId: args.runId,
        name: args.name,
        dataCount: 0,
        done: false,
        createdAt: now,
        updatedAt: now,
      });
      meta = await ctx.db.get(id);
    }
    if (!meta) {
      worldError("WORLD_ERROR", `Stream meta insert failed for ${streamId}`);
    }
    if (meta.done) {
      // Writes after close are dropped (matches world-local semantics of a
      // closed sink); report an error only for data writes.
      if (args.chunks.length > 0) {
        worldError("WORLD_ERROR", `Stream ${streamId} is already closed`);
      }
      return null;
    }
    let seq = meta.dataCount;
    for (const chunk of args.chunks) {
      await ctx.db.insert("streamChunks", {
        streamId,
        seq,
        data: chunk,
        createdAt: now,
      });
      seq += 1;
    }
    await ctx.db.patch(meta._id, {
      dataCount: seq,
      done: args.eof,
      updatedAt: now,
    });
    return null;
  },
});

const metaValidator = v.union(
  v.object({ dataCount: v.number(), done: v.boolean() }),
  v.null(),
);

/** Reactive meta for live readers + O(1) getInfo. */
export const meta = query({
  args: { secret: v.string(), runId: v.string(), name: v.string() },
  returns: metaValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const doc = await ctx.db
      .query("streams")
      .withIndex("by_streamId", (q) =>
        q.eq("streamId", streamKey(args.runId, args.name)),
      )
      .unique();
    return doc ? { dataCount: doc.dataCount, done: doc.done } : null;
  },
});

export const getChunksPage = query({
  args: {
    secret: v.string(),
    runId: v.string(),
    name: v.string(),
    /** Return chunks with seq >= startSeq */
    startSeq: v.number(),
    limit: v.number(),
  },
  returns: v.object({
    chunks: v.array(v.object({ seq: v.number(), data: v.bytes() })),
    dataCount: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const streamId = streamKey(args.runId, args.name);
    const metaDoc = await ctx.db
      .query("streams")
      .withIndex("by_streamId", (q) => q.eq("streamId", streamId))
      .unique();
    if (!metaDoc) {
      return { chunks: [], dataCount: 0, done: false };
    }
    const rows = await ctx.db
      .query("streamChunks")
      .withIndex("by_stream", (q) =>
        q.eq("streamId", streamId).gte("seq", args.startSeq),
      )
      .order("asc")
      .take(Math.min(args.limit, 200));
    return {
      chunks: rows.map((r) => ({ seq: r.seq, data: r.data })),
      dataCount: metaDoc.dataCount,
      done: metaDoc.done,
    };
  },
});

export const list = query({
  args: { secret: v.string(), runId: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const docs = await ctx.db
      .query("streams")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
    return docs.map((d) => d.name);
  },
});
