import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";

/**
 * Durable queue backing the world-convex Queue implementation.
 *
 * Lifecycle: enqueue (pending) → claim (claimed, leased) → one of
 *   complete (row deleted) | reschedule (pending again at a later time)
 *   | fail (pending with backoff, or dead after maxFails).
 *
 * Two delivery modes share this table:
 *
 * - Pump mode (external eve host): the host subscribes to `wake`, claims due
 *   jobs with the public mutations and delivers them over HTTP to its own
 *   workflow endpoints.
 * - Convex mode (`WORLD_EXECUTION_MODE=convex` on the deployment): every
 *   transition that makes a job runnable also schedules the in-Convex runner
 *   action (runner/engine:tick), which executes the eve workflow handler
 *   in-process inside a "use node" action. The runner uses the `runner*`
 *   internal mutations below (same logic, no service secret).
 *
 * Leases guard against a crashed worker in both modes: `requeueExpired`
 * (cron) flips expired claims back to pending. `recoveredCount` tracks how
 * many times in a row that recovery fired without the job ever reaching a
 * normal settle (complete / reschedule / release / fail): each recovery is
 * a worker that died mid-delivery, and since crash-requeues bypass
 * `failCount` entirely, a delivery that can never finish (e.g. a single
 * workflow step that outruns the node action ceiling) would otherwise
 * requeue forever. At MAX_LEASE_RECOVERIES the job dead-letters with a
 * descriptive error instead.
 */

const DEFAULT_MAX_FAILS = 3;
const MAX_LEASE_RECOVERIES = 5;

function convexExecutionMode(): boolean {
  return process.env.WORLD_EXECUTION_MODE === "convex";
}

/** In Convex mode, make sure a runner tick fires once this delay elapses. */
async function scheduleRunnerTick(
  ctx: MutationCtx,
  delayMs: number,
): Promise<void> {
  if (!convexExecutionMode()) return;
  await ctx.scheduler.runAfter(
    Math.max(0, delayMs),
    internal.runner.engine.tick,
    {},
  );
}

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

const enqueueArgs = {
  queueName: v.string(),
  queuePrefix: v.string(),
  queueId: v.string(),
  messageId: v.string(),
  payloadJson: v.string(),
  headersJson: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
  jobKey: v.optional(v.string()),
  delayMs: v.optional(v.number()),
  /** Preserve the delivery counter across timeoutSeconds reschedules */
  attempt: v.optional(v.number()),
};

type EnqueueArgs = {
  queueName: string;
  queuePrefix: string;
  queueId: string;
  messageId: string;
  payloadJson: string;
  headersJson?: string;
  idempotencyKey?: string;
  jobKey?: string;
  delayMs?: number;
  attempt?: number;
};

async function enqueueImpl(
  ctx: MutationCtx,
  args: EnqueueArgs,
): Promise<{ messageId: string; deduped: boolean }> {
  const now = Date.now();
  const delayMs = Math.max(0, args.delayMs ?? 0);
  const runAfter = now + delayMs;

  if (args.jobKey !== undefined) {
    const existing = await ctx.db
      .query("queueJobs")
      .withIndex("by_jobKey", (q) => q.eq("jobKey", args.jobKey))
      .first();
    if (existing && existing.state === "pending") {
      // graphile-worker jobKey semantics: replace the pending job. The
      // replacement is a logically new message, so consecutive-failure
      // bookkeeping (failCount, recoveredCount) starts over with it.
      await ctx.db.patch(existing._id, {
        queueName: args.queueName,
        queuePrefix: args.queuePrefix,
        queueId: args.queueId,
        messageId: args.messageId,
        payloadJson: args.payloadJson,
        headersJson: args.headersJson,
        idempotencyKey: args.idempotencyKey,
        runAfter,
        attempt: args.attempt ?? existing.attempt,
        failCount: 0,
        recoveredCount: undefined,
        updatedAt: now,
      });
      await scheduleRunnerTick(ctx, delayMs);
      return { messageId: args.messageId, deduped: true };
    }
    if (existing && existing.state === "claimed") {
      // A worker is executing this key right now; drop the duplicate.
      // The executing delivery is responsible for rescheduling itself.
      return { messageId: existing.messageId, deduped: true };
    }
  }

  await ctx.db.insert("queueJobs", {
    queueName: args.queueName,
    queuePrefix: args.queuePrefix,
    queueId: args.queueId,
    messageId: args.messageId,
    payloadJson: args.payloadJson,
    headersJson: args.headersJson,
    idempotencyKey: args.idempotencyKey,
    jobKey: args.jobKey,
    state: "pending",
    runAfter,
    attempt: args.attempt ?? 0,
    failCount: 0,
    maxFails: DEFAULT_MAX_FAILS,
    createdAt: now,
    updatedAt: now,
  });
  await scheduleRunnerTick(ctx, delayMs);
  return { messageId: args.messageId, deduped: false };
}

export const enqueue = mutation({
  args: { secret: v.string(), ...enqueueArgs },
  returns: v.object({ messageId: v.string(), deduped: v.boolean() }),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await enqueueImpl(ctx, args);
  },
});

/**
 * Reactive wake signal for the pump: earliest pending job's runAfter.
 * The pump subscribes to this; any enqueue/reschedule/requeue re-fires it.
 * (No Date.now() here — the client compares runAfter against its own clock.)
 */
export const wake = query({
  args: { secret: v.string() },
  returns: v.union(v.object({ nextRunAfter: v.number() }), v.null()),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const next = await ctx.db
      .query("queueJobs")
      .withIndex("by_state_runAfter", (q) => q.eq("state", "pending"))
      .order("asc")
      .first();
    return next ? { nextRunAfter: next.runAfter } : null;
  },
});

// ---------------------------------------------------------------------------
// claim / heartbeat
// ---------------------------------------------------------------------------

const claimedJobFields = {
  jobId: v.id("queueJobs"),
  queueName: v.string(),
  queuePrefix: v.string(),
  messageId: v.string(),
  payloadJson: v.string(),
  headersJson: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
  jobKey: v.optional(v.string()),
  attempt: v.number(),
  failCount: v.number(),
  maxFails: v.number(),
};

/** Wire shape the external world-convex pump zod-parses — no extra fields. */
const claimedJobValidator = v.object(claimedJobFields);

/** The in-Convex runner also gets createdAt (drives the BYOK key-wait cap). */
const runnerClaimedJobValidator = v.object({
  ...claimedJobFields,
  createdAt: v.number(),
});

type ClaimArgs = { workerId: string; now: number; max: number; leaseMs: number };

async function claimImpl(ctx: MutationCtx, args: ClaimArgs) {
  const due = await ctx.db
    .query("queueJobs")
    .withIndex("by_state_runAfter", (q) =>
      q.eq("state", "pending").lte("runAfter", args.now),
    )
    .order("asc")
    .take(args.max);

  const claimed = [];
  for (const job of due) {
    await ctx.db.patch(job._id, {
      state: "claimed",
      leaseUntil: args.now + args.leaseMs,
      claimedBy: args.workerId,
      // The claim IS the delivery attempt: count it here so a worker crash
      // mid-delivery still consumes an attempt after lease recovery.
      attempt: job.attempt + 1,
      updatedAt: args.now,
    });
    claimed.push({
      jobId: job._id,
      queueName: job.queueName,
      queuePrefix: job.queuePrefix,
      messageId: job.messageId,
      payloadJson: job.payloadJson,
      headersJson: job.headersJson,
      idempotencyKey: job.idempotencyKey,
      jobKey: job.jobKey,
      attempt: job.attempt + 1,
      failCount: job.failCount,
      maxFails: job.maxFails,
      createdAt: job.createdAt,
    });
  }
  return claimed;
}

export const claim = mutation({
  args: {
    secret: v.string(),
    workerId: v.string(),
    now: v.number(),
    max: v.number(),
    leaseMs: v.number(),
  },
  returns: v.array(claimedJobValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    // Strip createdAt: the pump's ClaimedJob zod schema doesn't know it.
    return (await claimImpl(ctx, args)).map(
      ({ createdAt: _createdAt, ...job }) => job,
    );
  },
});

export const runnerClaim = internalMutation({
  args: {
    workerId: v.string(),
    now: v.number(),
    max: v.number(),
    leaseMs: v.number(),
  },
  returns: v.array(runnerClaimedJobValidator),
  handler: async (ctx, args) => claimImpl(ctx, args),
});

async function heartbeatImpl(
  ctx: MutationCtx,
  args: { jobId: import("../_generated/dataModel").Id<"queueJobs">; workerId: string; leaseMs: number },
): Promise<boolean> {
  const job = await ctx.db.get(args.jobId);
  if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
    return false;
  }
  await ctx.db.patch(args.jobId, {
    leaseUntil: Date.now() + args.leaseMs,
    updatedAt: Date.now(),
  });
  return true;
}

/** Extend the lease of a job whose delivery is still in progress. */
export const heartbeat = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("queueJobs"),
    workerId: v.string(),
    leaseMs: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await heartbeatImpl(ctx, args);
  },
});

export const runnerHeartbeat = internalMutation({
  args: {
    jobId: v.id("queueJobs"),
    workerId: v.string(),
    leaseMs: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => heartbeatImpl(ctx, args),
});

// ---------------------------------------------------------------------------
// settle: complete / reschedule / release / fail
// ---------------------------------------------------------------------------

type SettleRef = {
  jobId: import("../_generated/dataModel").Id<"queueJobs">;
  workerId: string;
};

async function completeImpl(ctx: MutationCtx, args: SettleRef): Promise<null> {
  const job = await ctx.db.get(args.jobId);
  if (job && job.state === "claimed" && job.claimedBy === args.workerId) {
    await ctx.db.delete(args.jobId);
  }
  return null;
}

export const complete = mutation({
  args: { secret: v.string(), jobId: v.id("queueJobs"), workerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await completeImpl(ctx, args);
  },
});

export const runnerComplete = internalMutation({
  args: { jobId: v.id("queueJobs"), workerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => completeImpl(ctx, args),
});

async function rescheduleImpl(
  ctx: MutationCtx,
  args: SettleRef & { delayMs: number },
): Promise<null> {
  const job = await ctx.db.get(args.jobId);
  if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
    return null;
  }
  const now = Date.now();
  const delayMs = Math.max(0, args.delayMs);
  await ctx.db.patch(args.jobId, {
    state: "pending",
    runAfter: now + delayMs,
    failCount: 0,
    recoveredCount: undefined,
    leaseUntil: undefined,
    claimedBy: undefined,
    lastError: undefined,
    updatedAt: now,
  });
  await scheduleRunnerTick(ctx, delayMs);
  return null;
}

/** Handler asked to be re-delivered after `delayMs` (timeoutSeconds path). */
export const reschedule = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("queueJobs"),
    workerId: v.string(),
    delayMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await rescheduleImpl(ctx, args);
  },
});

export const runnerReschedule = internalMutation({
  args: { jobId: v.id("queueJobs"), workerId: v.string(), delayMs: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => rescheduleImpl(ctx, args),
});

async function releaseImpl(
  ctx: MutationCtx,
  args: SettleRef & { delayMs: number },
): Promise<null> {
  const job = await ctx.db.get(args.jobId);
  if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
    return null;
  }
  const now = Date.now();
  const delayMs = Math.max(0, args.delayMs);
  await ctx.db.patch(args.jobId, {
    state: "pending",
    runAfter: now + delayMs,
    // The claim consumed an attempt for a delivery that never happened;
    // hand it back so transport blips don't erode the delivery budget.
    attempt: Math.max(0, job.attempt - 1),
    recoveredCount: undefined,
    leaseUntil: undefined,
    claimedBy: undefined,
    updatedAt: now,
  });
  await scheduleRunnerTick(ctx, delayMs);
  return null;
}

/**
 * Transport-level failure (eve host unreachable): return the job to pending
 * WITHOUT consuming a failure — the handler was never reached. The pump
 * pauses until the host's health endpoint responds again.
 */
export const release = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("queueJobs"),
    workerId: v.string(),
    delayMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await releaseImpl(ctx, args);
  },
});

/**
 * Runner path: hand a claimed job back without consuming a delivery attempt.
 * Used when a session's BYOK key row hasn't committed yet (chat:send writes
 * it moments after the enqueue) — the job wasn't delivered at all.
 */
export const runnerRelease = internalMutation({
  args: { jobId: v.id("queueJobs"), workerId: v.string(), delayMs: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => releaseImpl(ctx, args),
});

async function failImpl(
  ctx: MutationCtx,
  args: SettleRef & { error: string; backoffMs: number },
): Promise<{ dead: boolean }> {
  const job = await ctx.db.get(args.jobId);
  if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
    return { dead: false };
  }
  const now = Date.now();
  const failCount = job.failCount + 1;
  if (failCount >= job.maxFails) {
    await ctx.db.patch(args.jobId, {
      state: "dead",
      failCount,
      lastError: args.error,
      leaseUntil: undefined,
      claimedBy: undefined,
      updatedAt: now,
    });
    return { dead: true };
  }
  const backoffMs = Math.max(0, args.backoffMs);
  await ctx.db.patch(args.jobId, {
    state: "pending",
    runAfter: now + backoffMs,
    failCount,
    recoveredCount: undefined,
    lastError: args.error,
    leaseUntil: undefined,
    claimedBy: undefined,
    updatedAt: now,
  });
  await scheduleRunnerTick(ctx, backoffMs);
  return { dead: false };
}

/** Delivery failed (HTTP error from the handler): back off or dead-letter. */
export const fail = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("queueJobs"),
    workerId: v.string(),
    error: v.string(),
    backoffMs: v.number(),
  },
  returns: v.object({ dead: v.boolean() }),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await failImpl(ctx, args);
  },
});

export const runnerFail = internalMutation({
  args: {
    jobId: v.id("queueJobs"),
    workerId: v.string(),
    error: v.string(),
    backoffMs: v.number(),
  },
  returns: v.object({ dead: v.boolean() }),
  handler: async (ctx, args) => failImpl(ctx, args),
});

// ---------------------------------------------------------------------------
// maintenance crons
// ---------------------------------------------------------------------------

/**
 * Cron: flip expired claims back to pending so a crashed worker can't strand
 * jobs. Each recovery bumps `recoveredCount`; a job recovered
 * MAX_LEASE_RECOVERIES times in a row without a normal settle is stuck in a
 * crash loop (typically a single step body that outruns the action window)
 * and dead-letters instead, with the loop explained in `lastError`.
 */
export const requeueExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const claimed = await ctx.db
      .query("queueJobs")
      .withIndex("by_state_runAfter", (q) => q.eq("state", "claimed"))
      .collect();
    let requeued = 0;
    for (const job of claimed) {
      if (job.leaseUntil === undefined || job.leaseUntil >= now) continue;
      const recoveredCount = (job.recoveredCount ?? 0) + 1;
      if (recoveredCount >= MAX_LEASE_RECOVERIES) {
        await ctx.db.patch(job._id, {
          state: "dead",
          recoveredCount,
          lastError:
            `lease expired ${recoveredCount} consecutive times without a ` +
            "normal settle — the worker keeps dying mid-delivery (most " +
            "likely a single workflow step exceeds the action time " +
            "budget). Dead-lettered to stop the crash loop; fix the step " +
            "(chunk it or move the long work behind a hook), then " +
            "`npx convex run world/queue:reviveDead`.",
          leaseUntil: undefined,
          claimedBy: undefined,
          updatedAt: now,
        });
        console.error("[queue] dead-lettered after repeated lease expiries", {
          queueName: job.queueName,
          messageId: job.messageId,
          recoveredCount,
        });
        continue;
      }
      await ctx.db.patch(job._id, {
        state: "pending",
        runAfter: now,
        recoveredCount,
        leaseUntil: undefined,
        claimedBy: undefined,
        updatedAt: now,
      });
      requeued += 1;
    }
    if (requeued > 0) {
      await scheduleRunnerTick(ctx, 0);
    }
    return requeued;
  },
});

/**
 * Cron: safety-net wake for Convex mode. Scheduled ticks can be lost when a
 * deploy replaces functions mid-flight; this sweeps due jobs once a minute.
 */
export const sweepDue = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    if (!convexExecutionMode()) return null;
    const next = await ctx.db
      .query("queueJobs")
      .withIndex("by_state_runAfter", (q) => q.eq("state", "pending"))
      .order("asc")
      .first();
    if (next && next.runAfter <= Date.now()) {
      await scheduleRunnerTick(ctx, 0);
    }
    return null;
  },
});

/** Ops: return dead jobs to pending (`npx convex run world/queue:reviveDead`).
 * Fresh delivery budget; the runner re-executes them (workflows replay
 * deterministically, so this is always safe). */
export const reviveDead = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const dead = await ctx.db
      .query("queueJobs")
      .withIndex("by_state_runAfter", (q) => q.eq("state", "dead"))
      .take(500);
    for (const job of dead) {
      await ctx.db.patch(job._id, {
        state: "pending",
        runAfter: now,
        failCount: 0,
        recoveredCount: undefined,
        lastError: undefined,
        updatedAt: now,
      });
    }
    if (dead.length > 0) {
      await scheduleRunnerTick(ctx, 0);
    }
    return dead.length;
  },
});

/** Ops: drop ALL dead-letter jobs now (`npx convex run world/queue:purgeDead`). */
export const purgeDead = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const dead = await ctx.db
      .query("queueJobs")
      .withIndex("by_state_runAfter", (q) => q.eq("state", "dead"))
      .take(500);
    for (const job of dead) {
      await ctx.db.delete(job._id);
    }
    return dead.length;
  },
});

/** Cron: drop dead jobs older than 7 days to keep the table bounded. */
export const cleanupDead = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const dead = await ctx.db
      .query("queueJobs")
      .withIndex("by_state_runAfter", (q) => q.eq("state", "dead"))
      .take(500);
    let deleted = 0;
    for (const job of dead) {
      if (job.updatedAt < cutoff) {
        await ctx.db.delete(job._id);
        deleted += 1;
      }
    }
    return deleted;
  },
});
