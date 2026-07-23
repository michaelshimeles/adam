"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, type ActionCtx } from "../_generated/server";
import type { ModelKeyCredential } from "../lib/modelKeys";
import { loadEveBundle, type EveBundle } from "./bundle";
import { OWNER, withModelKey } from "./modelKeyLock";

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
 * BYOK: the bundled runtime resolves model credentials from process-global
 * state (AI_GATEWAY_API_KEY / the AI SDK default-provider slot) at request
 * time. Each flow job's runId is a session id; the sessionKeys table says
 * whose key — gateway or OpenRouter — that session runs on. Since that
 * state is process-global, jobs are grouped by credential and each group
 * delivered inside withModelKey (a process-wide mutex) — two visitors'
 * keys never coexist during delivery, and no concurrent action's key
 * cleanup can clobber an in-flight delivery. `system` sessions (heartbeat
 * schedules) and queue health checks run on the deployment's own
 * credentials.
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
/**
 * Inline fast path (chat:send): total wall clock the send action spends
 * delivering its own session's jobs before handing the rest to scheduled
 * ticks. Covers the flow handler's yield budget (WORKFLOW_V2_TIMEOUT_MS,
 * 120s) plus slack — a normal turn finishes well inside it.
 */
const INLINE_BUDGET_MS = 3 * 60 * 1000;
/** Inline fast path: minimum poll delay while waiting for the next job. */
const INLINE_POLL_MS = 100;
/**
 * Inline fast path: hand off to scheduled ticks when the session's next
 * job is further out than this (a sleep or HITL wait, not a turn hop).
 */
const INLINE_MAX_WAIT_MS = 1_500;

/** Positive-number env override, read per invocation (env can change). */
function envMs(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export type ClaimedJob = {
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

type DeliveryBucket = {
  credential: ModelKeyCredential | typeof OWNER;
  jobs: ClaimedJob[];
};

/**
 * Sort claimed jobs into delivery buckets by model credential (provider +
 * key). Jobs whose session has no key row yet are released (or failed once
 * they're old enough) and excluded from delivery.
 */
async function partitionByKey(
  ctx: ActionCtx,
  workerId: string,
  jobs: ClaimedJob[],
): Promise<DeliveryBucket[]> {
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

  const buckets = new Map<string | typeof OWNER, DeliveryBucket>();
  const push = (
    credential: ModelKeyCredential | typeof OWNER,
    job: ClaimedJob,
  ) => {
    const id =
      credential === OWNER
        ? OWNER
        : `${credential.provider}\u0000${credential.apiKey}`;
    const bucket = buckets.get(id);
    if (bucket) bucket.jobs.push(job);
    else buckets.set(id, { credential, jobs: [job] });
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
      // Channels whose inbound route can't surface a session id (Telegram's
      // handler returns a bare ack) never get a key row. With the fallback
      // enabled (deployments that run such channels on their own
      // credentials), treat a missing row as deployment-owned. Web-chat BYOK
      // sessions are unaffected: chat.ts persists the key row before the
      // first job is enqueued.
      if (process.env.RUNNER_SYSTEM_KEY_FALLBACK === "1") {
        push(OWNER, job);
        continue;
      }
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
    else push({ provider: row.provider, apiKey: row.apiKey }, job);
  }
  return [...buckets.values()];
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
      if (buckets.length === 0) {
        // Everything was released waiting on its key; the releases already
        // scheduled a follow-up tick, so don't spin on the same jobs here.
        break;
      }
      for (const { credential, jobs: bucket } of buckets) {
        await withModelKey(credential, () =>
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

/**
 * Inline fast path for chat:send. The send action already paid the Node
 * cold start and bundle load, so instead of returning and waiting for a
 * scheduled tick (a fresh action spawn — often another cold start), it
 * delivers its own session's jobs right here: entry flow → turn workflow →
 * any near-term continuations. Jobs are claimed through the same queue
 * (runnerClaimSession), so durability is unchanged — if this action dies
 * mid-turn the lease expires and the normal tick/replay path recovers it,
 * and scheduled ticks racing us simply find the jobs already claimed.
 *
 * Must NOT be called from inside a withModelKey section (the process-wide
 * credential mutex is not reentrant); it wraps each delivery batch itself.
 */
export async function deliverSessionInline(
  ctx: ActionCtx,
  bundle: EveBundle,
  credential: ModelKeyCredential,
  sessionId: string,
): Promise<void> {
  const startedAt = Date.now();
  const workerId = `convex_inline_${crypto.randomUUID().slice(0, 8)}`;
  while (Date.now() - startedAt < INLINE_BUDGET_MS) {
    const { jobs, nextDueInMs } = (await ctx.runMutation(
      internal.world.queue.runnerClaimSession,
      {
        workerId,
        now: Date.now(),
        max: CLAIM_BATCH,
        leaseMs: LEASE_MS,
        sessionId,
      },
    )) as { jobs: ClaimedJob[]; nextDueInMs: number | null };

    if (jobs.length > 0) {
      await withModelKey(credential, () =>
        Promise.all(jobs.map((job) => deliver(ctx, bundle, workerId, job))),
      );
      continue;
    }
    // No due jobs. A turn hop (entry flow enqueues the turn workflow with
    // ~no delay) shows up as a small nextDueInMs — poll for it. Anything
    // further out (sleeps, HITL waits) belongs to the scheduled ticks,
    // which every enqueue/reschedule already arranged.
    if (nextDueInMs === null || nextDueInMs > INLINE_MAX_WAIT_MS) return;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(nextDueInMs, INLINE_POLL_MS)),
    );
  }
}

/**
 * Scheduled (0-delay) wrapper around deliverSessionInline for brand-new
 * chats: chat:send must return the fresh sessionId immediately so the
 * client can subscribe to ui:sessionEvents while the first turn streams,
 * so it hands delivery to this action instead of running it in-process.
 * Still much faster than the queue's tick path — it starts right away and
 * usually lands on the same warm isolate that just served the send.
 *
 * Takes only the session id: the visitor's key must never ride scheduler
 * arguments (they persist in the _scheduled_functions system table). It's
 * already committed to the sessionKeys trust boundary before scheduling,
 * so resolve it from there — same source the scheduled ticks use.
 */
export const inlineSession = internalAction({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rows = (await ctx.runQuery(internal.keys.resolveMany, {
      jobs: [{ runId: args.sessionId }],
    })) as {
      runId: string;
      apiKey?: string;
      provider: ModelKeyCredential["provider"];
      system: boolean;
    }[];
    const row = rows[0];
    if (!row || row.system || row.apiKey === undefined) {
      // No visitor key registered (or a system session) — leave the jobs
      // to the scheduled ticks, which handle owner-credential sessions.
      return null;
    }
    const { bundle } = await loadEveBundle(ctx);
    await deliverSessionInline(
      ctx,
      bundle,
      { provider: row.provider, apiKey: row.apiKey },
      args.sessionId,
    );
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
