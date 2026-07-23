import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * The agent builder's control plane. Users configure agents here; a build
 * worker (platform/worker) claims deploy jobs, materializes the agent from
 * the repo template, compiles it with `eve build`, provisions a fresh
 * Convex project, and reports back. One agent config = one Convex
 * deployment running that agent.
 */

/** Everything the deploy pipeline needs to materialize an agent. */
export const agentConfig = {
  name: v.string(),
  /** Base for the Convex project slug (suffix added at provision time). */
  slug: v.string(),
  /** AI Gateway model string, e.g. "anthropic/claude-sonnet-5". */
  model: v.string(),
  /** System prompt — becomes agent/instructions.md verbatim. */
  instructions: v.string(),
  /** Which catalog tools ship with the agent. */
  tools: v.object({
    saveNote: v.boolean(),
    listNotes: v.boolean(),
    clearNotes: v.boolean(),
    workflowStats: v.boolean(),
    // eve framework tools (on by default in eve; the pipeline writes a
    // disableTool() override when toggled off). Optional because rows
    // created before these toggles existed lack them — read as "true".
    webFetch: v.optional(v.boolean()),
    webSearch: v.optional(v.boolean()),
    // Assistant capability groups (each maps to a set of template files the
    // pipeline deletes when toggled off). Optional because rows created
    // before these toggles existed lack them — read as "true".
    memory: v.optional(v.boolean()),
    skills: v.optional(v.boolean()),
    reminders: v.optional(v.boolean()),
    eventTriggers: v.optional(v.boolean()),
    receipts: v.optional(v.boolean()),
    extras: v.optional(v.boolean()),
    delegation: v.optional(v.boolean()),
  }),
  /** IANA timezone for reminders/time rendering (AGENT_DEFAULT_TIMEZONE). */
  timezone: v.optional(v.string()),
  /** Optional markdown schedule (mirrored to a Convex cron). */
  schedule: v.object({
    enabled: v.boolean(),
    cron: v.string(),
    prompt: v.string(),
  }),
  /**
   * Inbound channels beyond the web chat. Optional for pre-channels rows —
   * read as "all disabled".
   */
  channels: v.optional(
    v.object({
      webhook: v.object({ enabled: v.boolean() }),
      /** Optional for pre-telegram rows — read as "disabled". */
      telegram: v.optional(
        v.object({
          enabled: v.boolean(),
          /** Comma-separated Telegram user ids; "" = any private DM. */
          allowedUserIds: v.string(),
        }),
      ),
    }),
  ),
};

const agentStatus = v.union(
  v.literal("draft"),
  v.literal("deploying"),
  v.literal("live"),
  v.literal("failed"),
  /** Teardown queued/running; the row disappears when the worker finishes. */
  v.literal("deleting"),
);

const jobStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("succeeded"),
  v.literal("failed"),
);

/** Absent = "deploy" (rows predate the delete feature). */
const jobKind = v.union(v.literal("deploy"), v.literal("delete"));

export default defineSchema({
  agents: defineTable({
    ...agentConfig,
    status: agentStatus,
    /** Set by create/update so the UI can show it without reading secrets. */
    hasGatewayKey: v.boolean(),
    hasTelegramToken: v.optional(v.boolean()),
    hasComposioKey: v.optional(v.boolean()),
    hasConvexDeployKey: v.optional(v.boolean()),
    // Deployment identity, populated after the first successful deploy.
    projectSlug: v.optional(v.string()),
    deploymentName: v.optional(v.string()),
    deploymentUrl: v.optional(v.string()),
    dashboardUrl: v.optional(v.string()),
    bundleVersion: v.optional(v.string()),
    /**
     * x-webhook-secret for the deployed webhook channel (set on deploy when
     * the channel is enabled). Shown in the dashboard so users can wire up
     * external callers — acceptable for the single-tenant demo.
     */
    webhookSecret: v.optional(v.string()),
    lastDeployedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  /**
   * Deployment credentials, split from `agents` so list/get queries can
   * never leak them to the browser. Only the worker (service secret) reads
   * these. Production would put them in a proper vault / encrypted at rest.
   */
  agentSecrets: defineTable({
    agentId: v.id("agents"),
    /** Deployment-level model credential (pays for schedule sessions). */
    aiGatewayApiKey: v.optional(v.string()),
    /** Telegram bot token (from @BotFather) for the telegram channel. */
    telegramBotToken: v.optional(v.string()),
    /** Composio API key for the composio MCP connection. */
    composioApiKey: v.optional(v.string()),
    /**
     * Bring-your-own-Convex: a deployment deploy key (prod:<name>|…) from
     * the user's own Convex project. When set, the pipeline deploys the
     * agent into that deployment instead of provisioning a project in the
     * operator's team.
     */
    convexDeployKey: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_agent", ["agentId"]),

  deployJobs: defineTable({
    agentId: v.id("agents"),
    kind: v.optional(jobKind),
    status: jobStatus,
    /** Current pipeline step while running (materialize/build/provision/…). */
    step: v.optional(v.string()),
    error: v.optional(v.string()),
    workerId: v.optional(v.string()),
    /** Number of log lines written (next seq base for appendLogs). */
    logCount: v.number(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_agent", ["agentId"]),

  jobLogs: defineTable({
    jobId: v.id("deployJobs"),
    seq: v.number(),
    line: v.string(),
    createdAt: v.number(),
  }).index("by_job", ["jobId", "seq"]),

  /** One row per worker id; lets the UI show "worker online/offline". */
  workerHeartbeats: defineTable({
    workerId: v.string(),
    lastSeen: v.number(),
  }).index("by_worker", ["workerId"]),
});
