import { setTimeout as sleep } from "node:timers/promises";
import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * Demonstration of the CHUNKED LONG-TASK pattern — the sanctioned way to run
 * work that could outlast one Convex action window (~10 minutes).
 *
 * A tool call executes as ONE workflow step, and a step body cannot be
 * suspended: if it runs longer than the remaining action window, the runner
 * is killed and the step re-executes from scratch on redelivery (until the
 * queue's crash-loop cap dead-letters the job). So a long task must never be
 * one call. Instead the tool does a bounded chunk per call and returns a
 * continuation cursor; the agent loop calls it again until `done`. Each call
 * is its own step: completed chunks are durable in the event log, and
 * between calls the flow handler is free to hit its yield budget
 * (WORKFLOW_V2_TIMEOUT_MS) and hand the turn to a fresh runner tick.
 *
 * Real long tools (browser sessions, large scrapes, batch jobs) follow the
 * same shape: persist progress/state keyed by the task, return
 * `{done: false, cursor}`, resume from the cursor on the next call. Work
 * that lives on an EXTERNAL service should instead kick off in one quick
 * step and wait on a hook (see clear_notes for the hook machinery) — waiting
 * on a hook holds no action open at all.
 */

const MAX_CHUNKS = 100;
const MAX_CHUNK_MS = 60_000;

export default defineTool({
  description:
    "Run one bounded chunk of a simulated long-running task and return a " +
    "continuation cursor. Call repeatedly, passing the returned cursor, " +
    "until done is true. Used to demonstrate/test durable long turns; the " +
    "work itself is just waiting.",
  inputSchema: z.object({
    task: z
      .string()
      .min(1)
      .max(200)
      .describe("Task identifier, kept stable across chunks"),
    totalChunks: z
      .number()
      .int()
      .min(1)
      .max(MAX_CHUNKS)
      .describe("How many chunks the task needs in total"),
    cursor: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Chunks already completed; pass the cursor from the previous call (0 to start)"),
    chunkMs: z
      .number()
      .int()
      .min(1)
      .max(MAX_CHUNK_MS)
      .default(2_000)
      .describe("How long one chunk of work takes, in milliseconds"),
  }),
  async execute({ task, totalChunks, cursor, chunkMs }) {
    const chunk = Math.min(cursor, totalChunks - 1) + 1;
    await sleep(chunkMs);
    const done = chunk >= totalChunks;
    return {
      task,
      done,
      cursor: chunk,
      totalChunks,
      status: done
        ? `chunk ${chunk}/${totalChunks} done — task complete`
        : `chunk ${chunk}/${totalChunks} done — call simulate_long_task again with cursor=${chunk}`,
    };
  },
});
