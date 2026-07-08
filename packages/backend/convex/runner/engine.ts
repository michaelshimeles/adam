"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, type ActionCtx } from "../_generated/server";
import { loadEveBundle, type EveBundle } from "./bundle";

/**
 * The in-Convex workflow executor. This replaces the eve host's queue pump:
 * queue mutations schedule `tick` whenever a job becomes runnable, and tick
 * delivers claimed jobs straight into the eve workflow handler (bundle.POST)
 * in-process — same Request/Response contract the HTTP pump used, no server.
 *
 * Delivery outcomes mirror world-postgres/world-convex pump semantics:
 *   200 {timeoutSeconds} → reschedule (sleep / retryAfter wake-ups)
 *   200 otherwise        → complete (row deleted)
 *   non-2xx / throw      → fail (backoff; dead-letter after maxFails)
 * There is no transport-error case: the handler runs in this process.
 *
 * While a delivery is running, a heartbeat keeps the job's lease alive so
 * the requeueExpired cron doesn't hand it to another tick. If this action
 * dies (deploy, crash, 10-minute action limit), the lease expires and the
 * cron requeues the job — the workflow replays deterministically from its
 * event log, which is exactly the crash-recovery story eve has on any host.
 */

const LEASE_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 45_000;
const FAIL_BACKOFF_MS = 5_000;
const CLAIM_BATCH = 4;
/** Leave headroom under the 10-minute node action ceiling. */
const MAX_WALL_MS = 8 * 60 * 1000;

type ClaimedJob = {
  jobId: import("../_generated/dataModel").Id<"queueJobs">;
  queueName: string;
  queuePrefix: string;
  messageId: string;
  payloadJson: string;
  headersJson?: string;
  attempt: number;
  failCount: number;
  maxFails: number;
};

export const tick = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { bundle } = await loadEveBundle();
    const workerId = `convex_runner_${crypto.randomUUID().slice(0, 8)}`;
    const deadline = Date.now() + MAX_WALL_MS;

    while (Date.now() < deadline) {
      const jobs = (await ctx.runMutation(internal.world.queue.runnerClaim, {
        workerId,
        now: Date.now(),
        max: CLAIM_BATCH,
        leaseMs: LEASE_MS,
      })) as ClaimedJob[];
      if (jobs.length === 0) break;
      await Promise.all(jobs.map((job) => deliver(ctx, bundle, workerId, job)));
    }

    // Any stream writes the handler awaited have flushed; this covers
    // stragglers on the world's flush timer before the process may idle.
    await new Promise((resolve) => setTimeout(resolve, 150));
    return null;
  },
});

async function deliver(
  ctx: ActionCtx,
  bundle: EveBundle,
  workerId: string,
  job: ClaimedJob,
): Promise<void> {
  const heartbeat = setInterval(() => {
    ctx
      .runMutation(internal.world.queue.runnerHeartbeat, {
        jobId: job.jobId,
        workerId,
        leaseMs: LEASE_MS,
      })
      .catch(() => {});
  }, HEARTBEAT_MS);
  heartbeat.unref?.();

  try {
    // eve 0.22 registers only the flow route: steps execute inline in the
    // flow invocation (turbo), so a step-queue job here means a config bug.
    if (job.queuePrefix.includes("_wkf_step_")) {
      await ctx.runMutation(internal.world.queue.runnerFail, {
        jobId: job.jobId,
        workerId,
        error:
          "convex runner: step queue jobs are not supported (steps run inline in the flow handler)",
        backoffMs: FAIL_BACKOFF_MS,
      });
      return;
    }

    const extraHeaders = job.headersJson
      ? (JSON.parse(job.headersJson) as Record<string, string>)
      : {};
    const request = new Request(
      "http://127.0.0.1/.well-known/workflow/v1/flow",
      {
        method: "POST",
        headers: {
          ...extraHeaders,
          "content-type": "application/json",
          "x-vqs-queue-name": job.queueName,
          "x-vqs-message-id": job.messageId,
          "x-vqs-message-attempt": String(job.failCount + 1),
        },
        body: job.payloadJson,
      },
    );

    let outcome:
      | { type: "completed" }
      | { type: "reschedule"; timeoutSeconds: number }
      | { type: "error"; message: string };
    try {
      const response = await bundle.POST(request);
      const text = await response.text();
      if (!response.ok) {
        outcome = { type: "error", message: text.slice(0, 2_000) };
      } else {
        outcome = { type: "completed" };
        try {
          const timeoutSeconds = Number(JSON.parse(text).timeoutSeconds);
          if (Number.isFinite(timeoutSeconds) && timeoutSeconds >= 0) {
            outcome = { type: "reschedule", timeoutSeconds };
          }
        } catch {
          // plain {ok} body — completed
        }
      }
    } catch (err) {
      outcome = { type: "error", message: String(err).slice(0, 2_000) };
    }

    switch (outcome.type) {
      case "completed":
        await ctx.runMutation(internal.world.queue.runnerComplete, {
          jobId: job.jobId,
          workerId,
        });
        return;
      case "reschedule":
        await ctx.runMutation(internal.world.queue.runnerReschedule, {
          jobId: job.jobId,
          workerId,
          delayMs: outcome.timeoutSeconds * 1000,
        });
        return;
      case "error": {
        console.error("[runner] workflow delivery failed", {
          queueName: job.queueName,
          messageId: job.messageId,
          error: outcome.message.slice(0, 500),
        });
        const result = await ctx.runMutation(internal.world.queue.runnerFail, {
          jobId: job.jobId,
          workerId,
          error: outcome.message,
          backoffMs: FAIL_BACKOFF_MS,
        });
        if (result.dead) {
          console.error("[runner] queue job dead-lettered", {
            queueName: job.queueName,
            messageId: job.messageId,
            maxFails: job.maxFails,
          });
        }
        return;
      }
    }
  } finally {
    clearInterval(heartbeat);
  }
}
