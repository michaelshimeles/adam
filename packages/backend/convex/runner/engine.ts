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
 * Long turns vs the ~10-minute node action ceiling: two cooperating budgets
 * keep deliveries clear of the platform kill.
 *
 *  1. The eve flow handler self-yields. Its run loop checks
 *     WORKFLOW_V2_TIMEOUT_MS (pinned in runner/bundle.ts, default 120s) at
 *     every step boundary; past the budget it enqueues a continuation flow
 *     message for the run and returns — so one multi-step turn straddles as
 *     many deliveries (and therefore actions) as it needs, replaying its
 *     event log and skipping completed steps each time.
 *  2. The tick stops claiming new work once it can no longer give a
 *     delivery a full reserve of wall clock (SAFE_BUDGET_MS −
 *     DELIVERY_RESERVE_MS), and hands off to a freshly scheduled successor
 *     tick that starts with a whole window.
 *
 * While a delivery is running, a heartbeat keeps the job's lease alive so
 * the requeueExpired cron doesn't hand it to another tick. If this action
 * still dies mid-delivery (deploy, crash, or a single step body outrunning
 * the remaining window — the one case the budgets can't cover), the lease
 * expires and the cron requeues the job; the workflow replays
 * deterministically from its event log. Repeated lease recoveries without a
 * normal settle dead-letter the job (see world/queue.ts) instead of crash-
 * looping forever.
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
/**
 * Total wall clock a tick allows itself, with headroom under the 10-minute
 * node action ceiling for the final delivery's settle mutations and stream
 * flush. Override per deployment for tests: RUNNER_SAFE_BUDGET_MS.
 */
const SAFE_BUDGET_MS_DEFAULT = 9.5 * 60 * 1000;
/**
 * Minimum window a delivery must have left before the tick will start it.
 * Sized to the flow handler's own yield budget (WORKFLOW_V2_TIMEOUT_MS,
 * 120s) plus slack for the step body in flight when that budget expires —
 * the handler only checks it between steps. Override for tests:
 * RUNNER_DELIVERY_RESERVE_MS.
 */
const DELIVERY_RESERVE_MS_DEFAULT = 4 * 60 * 1000;
/** Key row not there yet (chat:send commits it right after the enqueue). */
const KEY_WAIT_RETRY_MS = 500;
/** Give up on a job whose session never registered a key. */
const KEY_WAIT_MAX_MS = 90_000;

/** Positive-number env override, read per invocation (env can change). */
function envMs(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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
    const startedAt = Date.now();
    const safeBudgetMs = envMs("RUNNER_SAFE_BUDGET_MS", SAFE_BUDGET_MS_DEFAULT);
    const reserveMs = envMs(
      "RUNNER_DELIVERY_RESERVE_MS",
      DELIVERY_RESERVE_MS_DEFAULT,
    );
    const { bundle } = await loadEveBundle(ctx);
    const workerId = `convex_runner_${crypto.randomUUID().slice(0, 8)}`;

    let handedOff = false;
    for (let iteration = 0; ; iteration++) {
      // Claim another batch only while a delivery started now would still
      // get its full reserve; otherwise hand off to a successor tick that
      // begins with a whole action window. The first claim is unconditional
      // so every tick makes progress — otherwise a misconfigured budget
      // (reserve >= budget) would chain no-op successors forever.
      if (iteration > 0 && Date.now() - startedAt > safeBudgetMs - reserveMs) {
        handedOff = true;
        break;
      }
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

    if (handedOff) {
      // Settled deliveries schedule their own wakes, but jobs that were due
      // and never claimed have none — without this they'd stall until the
      // minutely sweep cron. A successor that finds nothing due is a no-op.
      await ctx.scheduler.runAfter(0, internal.runner.engine.tick, {});
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
    // Invariant check: eve 0.22 never enqueues to a step queue. Steps run
    // inline in the flow invocation, and background/overflow steps (parallel
    // fan-out past WORKFLOW_MAX_INLINE_STEPS, step retries) ride the
    // WORKFLOW queue as flow messages carrying {runId, stepId, stepName} —
    // the flow handler executes exactly that step. The bundle registers only
    // the flow route, so a __*_wkf_step_* job signals a protocol regression
    // (e.g. an eve upgrade that reintroduced the step route) and must fail
    // loudly rather than 400 forever against the flow handler.
    if (job.queuePrefix.includes("_wkf_step_")) {
      await ctx.runMutation(internal.world.queue.runnerFail, {
        jobId: job.jobId,
        workerId,
        error:
          "convex runner: unexpected step-queue job (eve 0.22 delivers background steps as flow messages; a step-queue message means the eve queue protocol changed — update runner/engine.ts)",
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
          // failCount + 1, NOT the claim count: parity with the world-convex
          // HTTP pump. The handler compares this against its max-deliveries
          // cap, and long-lived session jobs legitimately reschedule
          // (timeoutSeconds) hundreds of times — only consecutive failed
          // deliveries may count toward giving up on the message.
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
