import type { Streamer } from "@workflow/world";
import type { ConvexWorldClient } from "./client.js";
import { fns } from "./client.js";
import type { ConvexWorldConfig } from "./config.js";

/**
 * Convex-backed Streamer.
 *
 * Writes are buffered per stream and flushed as a batch mutation
 * (`world/streams:writeChunks`) on a short interval — one Convex round-trip
 * per flush instead of per chunk. Chunk order is the insertion order (each
 * chunk gets a 0-based `seq` assigned transactionally).
 *
 * Live reads subscribe to the stream's meta row (`world/streams:meta`) over
 * the Convex WebSocket; whenever `dataCount` grows, new chunks are paged in
 * with a non-reactive query. This gives real-time tailing without
 * re-downloading the whole stream on every update.
 */

const encoder = new TextEncoder();

interface PendingStream {
  chunks: ArrayBuffer[];
  eof: boolean;
  flushTimer: ReturnType<typeof setTimeout> | null;
  inflight: Promise<void> | null;
  waiters: Array<{ resolve: () => void; reject: (err: unknown) => void }>;
}

function toArrayBuffer(chunk: string | Uint8Array): ArrayBuffer {
  const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
  // Copy into a standalone ArrayBuffer (Convex v.bytes() wants ArrayBuffer,
  // and the source may be a view into a larger buffer).
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

export function createStreamer(
  client: ConvexWorldClient,
  config: ConvexWorldConfig,
): Streamer {
  const pending = new Map<string, PendingStream>();

  function keyOf(runId: string, name: string): string {
    return `${runId}/${name}`;
  }

  function getPending(key: string): PendingStream {
    let entry = pending.get(key);
    if (!entry) {
      entry = {
        chunks: [],
        eof: false,
        flushTimer: null,
        inflight: null,
        waiters: [],
      };
      pending.set(key, entry);
    }
    return entry;
  }

  async function flush(runId: string, name: string): Promise<void> {
    const key = keyOf(runId, name);
    const entry = pending.get(key);
    if (!entry) return;
    if (entry.flushTimer) {
      clearTimeout(entry.flushTimer);
      entry.flushTimer = null;
    }
    // Chain onto any in-flight flush to preserve chunk order.
    const previous = entry.inflight ?? Promise.resolve();
    const run = previous.then(async () => {
      const chunks = entry.chunks;
      const eof = entry.eof;
      const waiters = entry.waiters;
      if (chunks.length === 0 && !eof) return;
      entry.chunks = [];
      entry.eof = false;
      entry.waiters = [];
      try {
        await client.mutation(fns.streamsWriteChunks, {
          runId,
          name,
          chunks,
          eof,
        });
        for (const w of waiters) w.resolve();
      } catch (err) {
        for (const w of waiters) w.reject(err);
        throw err;
      }
    });
    entry.inflight = run.finally(() => {
      if (entry.inflight === run) entry.inflight = null;
    });
    await entry.inflight;
  }

  function scheduleFlush(runId: string, name: string, entry: PendingStream) {
    if (entry.flushTimer) return;
    entry.flushTimer = setTimeout(() => {
      entry.flushTimer = null;
      void flush(runId, name).catch((err) => {
        console.error("[world-convex] stream flush failed", {
          runId,
          name,
          error: String(err),
        });
      });
    }, config.streamFlushIntervalMs);
    entry.flushTimer.unref?.();
  }

  function enqueueWrite(
    runId: string,
    name: string,
    chunks: (string | Uint8Array)[],
    eof: boolean,
  ): Promise<void> {
    const entry = getPending(keyOf(runId, name));
    for (const chunk of chunks) {
      entry.chunks.push(toArrayBuffer(chunk));
    }
    if (eof) entry.eof = true;
    const done = new Promise<void>((resolve, reject) => {
      entry.waiters.push({ resolve, reject });
    });
    if (eof) {
      void flush(runId, name).catch(() => {});
    } else {
      scheduleFlush(runId, name, entry);
    }
    return done;
  }

  type MetaResult = { dataCount: number; done: boolean } | null;
  type ChunkPage = {
    chunks: Array<{ seq: number; data: ArrayBuffer }>;
    dataCount: number;
    done: boolean;
  };

  async function fetchMeta(runId: string, name: string): Promise<MetaResult> {
    return await client.query<MetaResult>(fns.streamsMeta, { runId, name });
  }

  const streams: Streamer["streams"] = {
    async write(runId, name, chunk) {
      await enqueueWrite(runId, name, [chunk], false);
    },

    async writeMulti(runId, name, chunks) {
      await enqueueWrite(runId, name, chunks, false);
    },

    async close(runId, name) {
      await enqueueWrite(runId, name, [], true);
    },

    async get(runId, name, startIndex = 0) {
      // Resolve a negative startIndex against the current tail.
      let nextSeq = startIndex;
      if (startIndex < 0) {
        const info = await fetchMeta(runId, name);
        const count = info?.dataCount ?? 0;
        nextSeq = Math.max(0, count + startIndex);
      }

      let unsubscribe: (() => void) | null = null;
      let pumping = false;
      let latestMeta: MetaResult = null;
      let failed: unknown = null;
      // Terminal guard: once the controller is closed/errored, never touch it
      // (or re-pump) again.
      let finished = false;

      return new ReadableStream<Uint8Array>({
        start: (controller) => {
          const finish = (error?: unknown) => {
            if (finished) return;
            finished = true;
            try {
              if (error === undefined) controller.close();
              else controller.error(error);
            } catch {
              // controller already closed by cancel(); nothing to do
            }
            unsubscribe?.();
            unsubscribe = null;
          };

          const pump = async () => {
            if (pumping || finished) return;
            pumping = true;
            try {
              while (!finished) {
                if (failed) {
                  finish(failed);
                  return;
                }
                const meta = latestMeta;
                if (!meta) return; // stream row not created yet — wait
                if (nextSeq < meta.dataCount) {
                  const page = await client.query<ChunkPage>(
                    fns.streamsGetChunksPage,
                    { runId, name, startSeq: nextSeq, limit: 100 },
                  );
                  if (finished) return;
                  for (const chunk of page.chunks) {
                    controller.enqueue(new Uint8Array(chunk.data));
                    nextSeq = chunk.seq + 1;
                  }
                  continue;
                }
                if (meta.done) {
                  finish();
                  return;
                }
                return; // caught up — wait for the next meta update
              }
            } catch (err) {
              finish(err);
            } finally {
              pumping = false;
              // A meta update may have arrived while paging.
              if (
                !finished &&
                latestMeta &&
                (failed ||
                  latestMeta.done ||
                  nextSeq < latestMeta.dataCount)
              ) {
                queueMicrotask(() => void pump());
              }
            }
          };

          unsubscribe = client.subscriber.onUpdate(
            fns.streamsMeta as any,
            { secret: client.secret, runId, name },
            (result: MetaResult) => {
              latestMeta = result;
              void pump();
            },
            (err: unknown) => {
              failed = err;
              void pump();
            },
          );
        },
        cancel: () => {
          finished = true;
          unsubscribe?.();
          unsubscribe = null;
        },
      });
    },

    async list(runId) {
      return await client.query<string[]>(fns.streamsList, { runId });
    },

    async getChunks(runId, name, options) {
      const limit = Math.min(options?.limit ?? 100, 1000);
      const startSeq = options?.cursor ? Number(options.cursor) : 0;
      const page = await client.query<ChunkPage>(fns.streamsGetChunksPage, {
        runId,
        name,
        startSeq: Number.isFinite(startSeq) ? startSeq : 0,
        limit,
      });
      const data = page.chunks.map((chunk) => ({
        index: chunk.seq,
        data: new Uint8Array(chunk.data),
      }));
      const nextSeq =
        data.length > 0 ? data[data.length - 1]!.index + 1 : startSeq;
      const hasMore = nextSeq < page.dataCount;
      return {
        data,
        cursor: hasMore || !page.done ? String(nextSeq) : null,
        hasMore,
        done: page.done,
      };
    },

    async getInfo(runId, name) {
      const meta = await fetchMeta(runId, name);
      return {
        tailIndex: (meta?.dataCount ?? 0) - 1,
        done: meta?.done ?? false,
      };
    },
  };

  return {
    streamFlushIntervalMs: config.streamFlushIntervalMs,
    streams,
  };
}
