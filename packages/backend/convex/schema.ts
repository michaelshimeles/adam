import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema backing a Vercel Workflow SDK "World" (used by eve).
 *
 * Opaque workflow payloads (run input/output, step results, errors, event
 * data) are stored as TypedJSON strings: JSON where Uint8Array values are
 * encoded as `{ "__type": "Uint8Array", "data": "<base64>" }`. This matches
 * the wire encoding used by world-local / world-postgres queues and avoids
 * Convex field-name restrictions on arbitrary payload keys. Payloads larger
 * than the inline limit are offloaded to Convex file storage and replaced
 * with a `{ "__type": "ConvexBlob", "id": "<storageId>" }` marker.
 *
 * All timestamps are epoch milliseconds.
 */

const runStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled"),
);

const stepStatus = runStatus;

export default defineSchema({
  runs: defineTable({
    runId: v.string(),
    status: runStatus,
    deploymentId: v.string(),
    workflowName: v.string(),
    specVersion: v.optional(v.number()),
    /** TypedJSON */
    input: v.optional(v.string()),
    /** TypedJSON */
    output: v.optional(v.string()),
    /** TypedJSON */
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    /** TypedJSON of Record<string, any> */
    executionContext: v.optional(v.string()),
    /** JSON of Record<string, string> (may contain reserved `$` keys) */
    attributesJson: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiredAt: v.optional(v.number()),
  })
    .index("by_runId", ["runId"])
    .index("by_status", ["status", "runId"])
    .index("by_workflowName", ["workflowName", "runId"])
    .index("by_workflow_status", ["workflowName", "status", "runId"]),

  steps: defineTable({
    runId: v.string(),
    stepId: v.string(),
    stepName: v.string(),
    status: stepStatus,
    /** TypedJSON */
    input: v.optional(v.string()),
    /** TypedJSON */
    output: v.optional(v.string()),
    /** TypedJSON */
    error: v.optional(v.string()),
    attempt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    retryAfter: v.optional(v.number()),
    specVersion: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_run", ["runId", "stepId"]),

  events: defineTable({
    eventId: v.string(),
    runId: v.string(),
    eventType: v.string(),
    correlationId: v.optional(v.string()),
    /** TypedJSON */
    eventDataJson: v.optional(v.string()),
    specVersion: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_run", ["runId", "eventId"])
    .index("by_correlation", ["correlationId", "eventId"])
    // Enforces the one-shot uniqueness of entity-creation events
    // (step_created / hook_created / wait_created / attr_set) per
    // (runId, correlationId, eventType) inside the createEvent mutation.
    .index("by_run_correlation_type", ["runId", "correlationId", "eventType"]),

  hooks: defineTable({
    runId: v.string(),
    hookId: v.string(),
    token: v.string(),
    ownerId: v.string(),
    projectId: v.string(),
    environment: v.string(),
    /** TypedJSON */
    metadata: v.optional(v.string()),
    specVersion: v.optional(v.number()),
    isWebhook: v.optional(v.boolean()),
    isSystem: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_hookId", ["hookId"])
    .index("by_token", ["token"])
    .index("by_run", ["runId", "hookId"]),

  waits: defineTable({
    waitId: v.string(),
    runId: v.string(),
    status: v.union(v.literal("waiting"), v.literal("completed")),
    resumeAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    specVersion: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_waitId", ["waitId"])
    .index("by_run", ["runId"]),

  /** Per-stream metadata: reactive subscription target + O(1) getInfo. */
  streams: defineTable({
    /** Composite key `${runId}/${name}` (stream names are per-run) */
    streamId: v.string(),
    runId: v.string(),
    name: v.string(),
    /** Number of data chunks written so far (also the next seq) */
    dataCount: v.number(),
    done: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_streamId", ["streamId"])
    .index("by_run", ["runId"]),

  streamChunks: defineTable({
    streamId: v.string(),
    /** 0-based position of this chunk in the stream */
    seq: v.number(),
    data: v.bytes(),
    createdAt: v.number(),
  }).index("by_stream", ["streamId", "seq"]),

  /**
   * Durable queue jobs. The eve host's world-convex worker subscribes to
   * pending jobs, claims them with a lease, and delivers them over HTTP to
   * the local workflow endpoints (`/.well-known/workflow/v1/{flow,step}`).
   */
  queueJobs: defineTable({
    /** Full queue name: `${prefix}${queueId}` */
    queueName: v.string(),
    /** `__wkf_workflow_` / `__wkf_step_` (+ namespace variants) */
    queuePrefix: v.string(),
    /** Sub-queue id (workflow name or step name) */
    queueId: v.string(),
    messageId: v.string(),
    /** TypedJSON of the QueuePayload */
    payloadJson: v.string(),
    headersJson: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    /** Upsert key: pending jobs with the same key are replaced on enqueue */
    jobKey: v.optional(v.string()),
    state: v.union(
      v.literal("pending"),
      v.literal("claimed"),
      v.literal("done"),
      v.literal("dead"),
    ),
    /** Deliver at/after this time */
    runAfter: v.number(),
    /** Deliveries that reached a handler (drives x-vqs-message-attempt) */
    attempt: v.number(),
    /** Consecutive failed deliveries (reset by successful reschedule) */
    failCount: v.number(),
    maxFails: v.number(),
    /**
     * Consecutive lease-expiry recoveries (worker died mid-delivery: crash,
     * deploy, action kill). Reset by any normal settle; at the cap the job
     * dead-letters instead of crash-looping — see world/queue.ts.
     */
    recoveredCount: v.optional(v.number()),
    leaseUntil: v.optional(v.number()),
    claimedBy: v.optional(v.string()),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_state_runAfter", ["state", "runAfter"])
    .index("by_jobKey", ["jobKey"])
    .index("by_messageId", ["messageId"]),

  /**
   * App-level demo table: the agent's durable team notepad. Written by the
   * agent's `save_note` tool (service secret), read live by the Svelte UI.
   */
  notes: defineTable({
    text: v.string(),
    /** Who/what saved it (session id or a user handle) */
    author: v.string(),
    createdAt: v.number(),
  }),

  /**
   * Versioned manifests of the compiled eve bundle, stored as files in
   * Convex file storage. This is how the agent runtime reaches deployments
   * whose node actions run off-machine (Convex Cloud): the runner downloads
   * the active manifest's files to /tmp and dynamic-imports from there
   * (see runner/bundle.ts). Exactly one row is active at a time; uploading
   * a new bundle hot-swaps the agent without a code deploy.
   */
  eveBundles: defineTable({
    /** Content hash of the bundle files (stable across identical uploads) */
    version: v.string(),
    files: v.array(
      v.object({
        /** Relative path inside the bundle dir, e.g. "_libs/eve.mjs" */
        path: v.string(),
        storageId: v.id("_storage"),
        size: v.number(),
        sha256: v.string(),
      }),
    ),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_version", ["version"]),

  /**
   * BYOK: visitor-supplied AI Gateway keys, keyed by session run id
   * (sessionId === the session workflow's runId). The runner injects the
   * session's key before delivering its jobs, so public visitors spend
   * their own gateway credits. `system: true` rows (heartbeat schedule
   * sessions) use the deployment's own credentials instead.
   */
  sessionKeys: defineTable({
    sessionId: v.string(),
    apiKey: v.optional(v.string()),
    system: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_updatedAt", ["updatedAt"]),
});
