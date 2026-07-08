import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireServiceSecret } from "../lib/auth";

/**
 * Durable queue backing the world-convex Queue implementation.
 *
 * Lifecycle: enqueue (pending) → claim (claimed, leased) → one of
 *   complete (row deleted) | reschedule (pending again at a later time)
 *   | fail (pending with backoff, or dead after maxFails).
 *
 * The eve host runs a pump that subscribes to `wake`, claims due jobs and
 * delivers them over HTTP to the workflow/step endpoints. Leases guard
 * against a crashed pump: `requeueExpired` (cron + opportunistic during
 * claim) flips expired claims back to pending.
 */

const DEFAULT_MAX_FAILS = 3;

export const enqueue = mutation({
  args: {
    secret: v.string(),
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
  },
  returns: v.object({ messageId: v.string(), deduped: v.boolean() }),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const now = Date.now();
    const runAfter = now + Math.max(0, args.delayMs ?? 0);

    if (args.jobKey !== undefined) {
      const existing = await ctx.db
        .query("queueJobs")
        .withIndex("by_jobKey", (q) => q.eq("jobKey", args.jobKey))
        .first();
      if (existing && existing.state === "pending") {
        // graphile-worker jobKey semantics: replace the pending job.
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
          updatedAt: now,
        });
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
    return { messageId: args.messageId, deduped: false };
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

const claimedJobValidator = v.object({
  jobId: v.id("queueJobs"),
  queueName: v.string(),
  messageId: v.string(),
  payloadJson: v.string(),
  headersJson: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
  jobKey: v.optional(v.string()),
  attempt: v.number(),
  failCount: v.number(),
  maxFails: v.number(),
});

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
        // The claim IS the delivery attempt: count it here so a pump crash
        // mid-delivery still consumes an attempt after lease recovery.
        attempt: job.attempt + 1,
        updatedAt: args.now,
      });
      claimed.push({
        jobId: job._id,
        queueName: job.queueName,
        messageId: job.messageId,
        payloadJson: job.payloadJson,
        headersJson: job.headersJson,
        idempotencyKey: job.idempotencyKey,
        jobKey: job.jobKey,
        attempt: job.attempt + 1,
        failCount: job.failCount,
        maxFails: job.maxFails,
      });
    }
    return claimed;
  },
});

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
    const job = await ctx.db.get(args.jobId);
    if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
      return false;
    }
    await ctx.db.patch(args.jobId, {
      leaseUntil: Date.now() + args.leaseMs,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const complete = mutation({
  args: { secret: v.string(), jobId: v.id("queueJobs"), workerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const job = await ctx.db.get(args.jobId);
    if (job && job.state === "claimed" && job.claimedBy === args.workerId) {
      await ctx.db.delete(args.jobId);
    }
    return null;
  },
});

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
    const job = await ctx.db.get(args.jobId);
    if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(args.jobId, {
      state: "pending",
      runAfter: now + Math.max(0, args.delayMs),
      failCount: 0,
      leaseUntil: undefined,
      claimedBy: undefined,
      lastError: undefined,
      updatedAt: now,
    });
    return null;
  },
});

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
    const job = await ctx.db.get(args.jobId);
    if (!job || job.state !== "claimed" || job.claimedBy !== args.workerId) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(args.jobId, {
      state: "pending",
      runAfter: now + Math.max(0, args.delayMs),
      // The claim consumed an attempt for a delivery that never happened;
      // hand it back so transport blips don't erode the delivery budget.
      attempt: Math.max(0, job.attempt - 1),
      leaseUntil: undefined,
      claimedBy: undefined,
      updatedAt: now,
    });
    return null;
  },
});

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
    await ctx.db.patch(args.jobId, {
      state: "pending",
      runAfter: now + Math.max(0, args.backoffMs),
      failCount,
      lastError: args.error,
      leaseUntil: undefined,
      claimedBy: undefined,
      updatedAt: now,
    });
    return { dead: false };
  },
});

/** Cron: flip expired claims back to pending so a crashed pump can't strand jobs. */
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
      if (job.leaseUntil !== undefined && job.leaseUntil < now) {
        await ctx.db.patch(job._id, {
          state: "pending",
          runAfter: now,
          leaseUntil: undefined,
          claimedBy: undefined,
          updatedAt: now,
        });
        requeued += 1;
      }
    }
    return requeued;
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
