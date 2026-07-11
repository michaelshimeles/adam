"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, type ActionCtx } from "../_generated/server";
import { loadEveBundle, type EveBundle } from "./bundle";
import { OWNER, withGatewayKey } from "./gatewayKeyLock";

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
 *
 * BYOK: the bundled runtime resolves model credentials from
 * process.env.AI_GATEWAY_API_KEY at request time. Each flow job's runId is
 * a session id; the sessionKeys table says whose gateway key that session
 * runs on. Since env is process-global, jobs are grouped by key and each
 * group delivered inside withGatewayKey (a process-wide mutex) — two
 * visitors' keys never coexist during delivery, and no concurrent action's
 * key cleanup can clobber an in-flight delivery. `system` sessions
 * (heartbeat schedules) and queue health checks run on the deployment's
 * own credentials.
 */

const LEASE_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 45_000;
const FAIL_BACKOFF_MS = 5_000;
const CLAIM_BATCH = 4;
/** Leave headroom under the 10-minute node action ceiling. */
const MAX_WALL_MS = 8 * 60 * 1000;
/** Key row not there yet (chat:send commits it right after the enqueue). */
const KEY_WAIT_RETRY_MS = 500;
/** Give up on a job whose session never registered a key. */
const KEY_WAIT_MAX_MS = 90_000;

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
  createdAt: number;
};

type JobKeyRef = {
  runId: string;
  /** `$eve.root` — the session run this job's run belongs to, if a child. */
  root?: string;
};

/** Flow payloads carry the run id (+ session root attribute); health checks don't. */
function keyRefOf(job: ClaimedJob): JobKeyRef | null {
  try {
    const payload = JSON.parse(job.payloadJson) as {
      runId?: unknown;
      runInput?: { attributes?: Record<string, unknown> };
    };
    if (typeof payload.runId !== "string") return null;
    const root = payload.runInput?.attributes?.["$eve.root"];
    return {
      runId: payload.runId,
      ...(typeof root === "string" ? { root } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Sort claimed jobs into delivery buckets by gateway key. Jobs whose session
 * has no key row yet are released (or failed once they're old enough) and
 * excluded from delivery.
 */
async function partitionByKey(
  ctx: ActionCtx,
  workerId: string,
  jobs: ClaimedJob[],
): Promise<Map<string | typeof OWNER, ClaimedJob[]>> {
  const refs = new Map<string, JobKeyRef>();
  for (const job of jobs) {
    const ref = keyRefOf(job);
    if (ref) refs.set(ref.runId, ref);
  }
  const rows =
    refs.size > 0
      ? await ctx.runQuery(internal.keys.resolveMany, {
          jobs: [...refs.values()],
        })
      : [];
  const keyByRun = new Map(rows.map((row) => [row.runId, row]));

  const buckets = new Map<string | typeof OWNER, ClaimedJob[]>();
  const push = (key: string | typeof OWNER, job: ClaimedJob) => {
    const bucket = buckets.get(key);
    if (bucket) bucket.push(job);
    else buckets.set(key, [job]);
  };

  for (const job of jobs) {
    const ref = keyRefOf(job);
    if (ref === null) {
      // Queue health check — no model calls involved.
      push(OWNER, job);
      continue;
    }
    const row = keyByRun.get(ref.runId);
    if (!row) {
      if (Date.now() - job.createdAt > KEY_WAIT_MAX_MS) {
        await ctx.runMutation(internal.world.queue.runnerFail, {
          jobId: job.jobId,
          workerId,
          error:
            "no API key registered for this session (BYOK row never appeared)",
          backoffMs: FAIL_BACKOFF_MS,
        });
      } else {
        await ctx.runMutation(internal.world.queue.runnerRelease, {
          jobId: job.jobId,
          workerId,
          delayMs: KEY_WAIT_RETRY_MS,
        });
      }
      continue;
    }
    if (row.system || row.apiKey === undefined) push(OWNER, job);
    else push(row.apiKey, job);
  }
  return buckets;
}

export const tick = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { bundle } = await loadEveBundle(ctx);
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

      const buckets = await partitionByKey(ctx, workerId, jobs);
      if (buckets.size === 0) {
        // Everything was released waiting on its key; the releases already
        // scheduled a follow-up tick, so don't spin on the same jobs here.
        break;
      }
      for (const [key, bucket] of buckets) {
        await withGatewayKey(key, () =>
          Promise.all(bucket.map((job) => deliver(ctx, bundle, workerId, job))),
        );
      }
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

    // Self-heal namespace-less enqueues. The enqueue side resolves
    // WORKFLOW_QUEUE_NAMESPACE from process.env at call time, and on a cold
    // deployment start (e.g. a cron catch-up firing before env injection
    // settles) a job can land as __wkf_* instead of __<ns>_wkf_*. The
    // handler only registers the namespaced queue, so deliver under the
    // corrected name — this deployment runs exactly one agent.
    let queueName = job.queueName;
    const ns = process.env.WORKFLOW_QUEUE_NAMESPACE;
    if (ns && queueName.startsWith("__wkf_")) {
      queueName = `__${ns}_wkf_${queueName.slice("__wkf_".length)}`;
      console.warn("[runner] normalized queue name", {
        from: job.queueName,
        to: queueName,
      });
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
          "x-vqs-queue-name": queueName,
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
