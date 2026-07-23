import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { agentConfig } from "./schema";
import {
  hasLiveWorker,
  ownsAgent,
  purgeAgentRows,
  requireAgentOwner,
  requireDashboardSecret,
  slugify,
} from "./lib";

/**
 * Public UI surface for the builder dashboard.
 *
 * Access control, two independent layers:
 *  - `dashboardSecret`: optional site-wide gate, checked against the
 *    BUILDER_DASHBOARD_SECRET env var (lib.ts). Set it on deployed builders;
 *    leave it unset for open local-dev/demo use.
 *  - `ownerToken`: per-browser capability minted by the UI (localStorage).
 *    Agents are stamped with it on create; list/get/mutations only match the
 *    caller's own agents, so visitors never see each other's agents. Rows
 *    from before tokens existed are unclaimed — visible to everyone until a
 *    token-bearing browser writes to them. Real user auth would replace this.
 */

/** Shared args: site gate secret + per-browser owner token. */
const dashboardAuthArgs = {
  dashboardSecret: v.optional(v.string()),
  ownerToken: v.optional(v.string()),
};

/** Strip the owner capability token before a row leaves the deployment. */
function toSummary(agent: Doc<"agents">): Omit<Doc<"agents">, "ownerToken"> {
  const { ownerToken: _ownerToken, ...summary } = agent;
  return summary;
}

const agentSummary = v.object({
  _id: v.id("agents"),
  _creationTime: v.number(),
  ...agentConfig,
  status: v.union(
    v.literal("draft"),
    v.literal("deploying"),
    v.literal("live"),
    v.literal("failed"),
    v.literal("deleting"),
  ),
  hasGatewayKey: v.boolean(),
  hasTelegramToken: v.optional(v.boolean()),
  hasComposioKey: v.optional(v.boolean()),
  hasConvexDeployKey: v.optional(v.boolean()),
  projectSlug: v.optional(v.string()),
  deploymentName: v.optional(v.string()),
  deploymentUrl: v.optional(v.string()),
  dashboardUrl: v.optional(v.string()),
  bundleVersion: v.optional(v.string()),
  /**
   * Shared secret callers put in x-webhook-secret. Exposing it to the
   * dashboard is the point (users wire it into their external systems);
   * reads are scoped to the agent's owner token (plus the optional
   * site-wide dashboard gate).
   */
  webhookSecret: v.optional(v.string()),
  lastDeployedAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const configArgs = {
  name: v.string(),
  model: v.string(),
  instructions: v.string(),
  tools: v.object({
    saveNote: v.boolean(),
    listNotes: v.boolean(),
    clearNotes: v.boolean(),
    workflowStats: v.boolean(),
    webFetch: v.boolean(),
    webSearch: v.boolean(),
    memory: v.boolean(),
    skills: v.boolean(),
    reminders: v.boolean(),
    eventTriggers: v.boolean(),
    receipts: v.boolean(),
    extras: v.boolean(),
    delegation: v.boolean(),
  }),
  timezone: v.string(),
  schedule: v.object({
    enabled: v.boolean(),
    cron: v.string(),
    prompt: v.string(),
  }),
  channels: v.object({
    webhook: v.object({ enabled: v.boolean() }),
    telegram: v.object({
      enabled: v.boolean(),
      allowedUserIds: v.string(),
    }),
  }),
};

function validateConfig(args: {
  name: string;
  model: string;
  instructions: string;
  timezone: string;
  schedule: { enabled: boolean; cron: string; prompt: string };
  channels: { telegram: { allowedUserIds: string } };
}): void {
  if (args.timezone.trim().length === 0) {
    throw new Error("Timezone is required (IANA name, e.g. America/Toronto)");
  }
  const ids = args.channels.telegram.allowedUserIds.trim();
  if (ids.length > 0 && !/^[0-9]+(\s*,\s*[0-9]+)*$/.test(ids)) {
    throw new Error(
      "Telegram allowed user ids must be comma-separated numeric ids",
    );
  }
  if (args.name.trim().length < 2) throw new Error("Name must be at least 2 characters");
  if (args.name.length > 60) throw new Error("Name must be at most 60 characters");
  if (args.model.trim().length === 0) throw new Error("Model is required");
  if (args.instructions.trim().length === 0) throw new Error("Instructions are required");
  if (args.schedule.enabled) {
    if (args.schedule.cron.trim().split(/\s+/).length !== 5) {
      throw new Error("Schedule cron must be a 5-field cron expression");
    }
    if (args.schedule.prompt.trim().length === 0) {
      throw new Error("Schedule prompt is required when the schedule is enabled");
    }
  }
}

/**
 * A bring-your-own-Convex key must be a deployment deploy key
 * ("prod:<deployment-name>|…" from the project's Settings → Deploy key) —
 * the pipeline derives the target deployment from its prefix.
 */
function validateConvexDeployKey(key: string): void {
  if (!/^(prod|dev):[a-z0-9-]+\|/.test(key)) {
    throw new Error(
      "Convex deploy key must be a deployment deploy key (starts with \"prod:<deployment-name>|\") — generate one under your Convex project's Settings → Deploy key",
    );
  }
}

export const list = query({
  args: { ...dashboardAuthArgs },
  returns: v.array(agentSummary),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const token = args.ownerToken?.trim() || undefined;
    // This browser's agents, plus unclaimed pre-token rows (kept visible so
    // existing operators can still find, claim, or delete them).
    const mine = token
      ? await ctx.db
          .query("agents")
          .withIndex("by_owner", (q) => q.eq("ownerToken", token))
          .order("desc")
          .take(100)
      : [];
    const legacy = await ctx.db
      .query("agents")
      .withIndex("by_owner", (q) => q.eq("ownerToken", undefined))
      .order("desc")
      .take(100);
    return [...mine, ...legacy]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100)
      .map(toSummary);
  },
});

export const get = query({
  args: { ...dashboardAuthArgs, agentId: v.id("agents") },
  returns: v.union(agentSummary, v.null()),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const agent = await ctx.db.get(args.agentId);
    if (!agent || !ownsAgent(agent, args.ownerToken?.trim() || undefined)) {
      return null;
    }
    return toSummary(agent);
  },
});

export const create = mutation({
  args: {
    ...dashboardAuthArgs,
    ...configArgs,
    /** Required — set as AI_GATEWAY_API_KEY on the deployed agent. */
    aiGatewayApiKey: v.string(),
    telegramBotToken: v.optional(v.string()),
    composioApiKey: v.optional(v.string()),
    convexDeployKey: v.optional(v.string()),
  },
  returns: v.id("agents"),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    validateConfig(args);
    const now = Date.now();
    const key = args.aiGatewayApiKey.trim();
    if (!key) {
      throw new ConvexError(
        "AI Gateway API key is required — chat and schedules bill this key",
      );
    }
    const telegramToken = args.telegramBotToken?.trim();
    const composioKey = args.composioApiKey?.trim();
    const deployKey = args.convexDeployKey?.trim();
    if (deployKey) validateConvexDeployKey(deployKey);
    const agentId = await ctx.db.insert("agents", {
      name: args.name.trim(),
      slug: slugify(args.name),
      model: args.model.trim(),
      instructions: args.instructions,
      tools: args.tools,
      timezone: args.timezone.trim(),
      schedule: args.schedule,
      channels: args.channels,
      status: "draft",
      ownerToken: args.ownerToken?.trim() || undefined,
      hasGatewayKey: true,
      hasTelegramToken: Boolean(telegramToken),
      hasComposioKey: Boolean(composioKey),
      hasConvexDeployKey: Boolean(deployKey),
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("agentSecrets", {
      agentId,
      aiGatewayApiKey: key,
      telegramBotToken: telegramToken || undefined,
      composioApiKey: composioKey || undefined,
      convexDeployKey: deployKey || undefined,
      updatedAt: now,
    });
    return agentId;
  },
});

export const update = mutation({
  args: {
    ...dashboardAuthArgs,
    agentId: v.id("agents"),
    ...configArgs,
    /** Omit to keep the stored key; pass a value to replace it; "" clears. */
    aiGatewayApiKey: v.optional(v.string()),
    /** Same omit/replace/clear semantics as aiGatewayApiKey. */
    telegramBotToken: v.optional(v.string()),
    /** Same omit/replace/clear semantics as aiGatewayApiKey. */
    composioApiKey: v.optional(v.string()),
    /** Same omit/replace/clear semantics as aiGatewayApiKey. */
    convexDeployKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const token = args.ownerToken?.trim() || undefined;
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    requireAgentOwner(agent, token);
    if (agent.status === "deploying") {
      throw new Error("Agent is deploying — wait for the current deploy to finish");
    }
    if (agent.status === "deleting") {
      throw new Error("Agent is being deleted");
    }
    validateConfig(args);
    const now = Date.now();

    let hasGatewayKey = agent.hasGatewayKey;
    let hasTelegramToken = agent.hasTelegramToken ?? false;
    let hasComposioKey = agent.hasComposioKey ?? false;
    let hasConvexDeployKey = agent.hasConvexDeployKey ?? false;
    const secretPatch: Record<string, string | number | undefined> = {};
    if (args.aiGatewayApiKey !== undefined) {
      const key = args.aiGatewayApiKey.trim();
      if (!key) {
        throw new ConvexError(
          "AI Gateway API key is required — chat and schedules bill this key",
        );
      }
      secretPatch.aiGatewayApiKey = key;
      hasGatewayKey = true;
    }
    if (args.telegramBotToken !== undefined) {
      const token = args.telegramBotToken.trim();
      secretPatch.telegramBotToken = token || undefined;
      hasTelegramToken = Boolean(token);
    }
    if (args.composioApiKey !== undefined) {
      const key = args.composioApiKey.trim();
      secretPatch.composioApiKey = key || undefined;
      hasComposioKey = Boolean(key);
    }
    if (args.convexDeployKey !== undefined) {
      const key = args.convexDeployKey.trim();
      if (key) validateConvexDeployKey(key);
      // Once deployed, the agent lives in the key's deployment — adding or
      // removing the key would strand it. Require a fresh agent instead.
      if (
        agent.deploymentName &&
        Boolean(key) !== (agent.hasConvexDeployKey ?? false)
      ) {
        throw new Error(
          "This agent is already deployed — the Convex deploy key can't be added or removed after the first deploy. Create a new agent instead.",
        );
      }
      secretPatch.convexDeployKey = key || undefined;
      hasConvexDeployKey = Boolean(key);
    }
    if (Object.keys(secretPatch).length > 0) {
      const secret = await ctx.db
        .query("agentSecrets")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .unique();
      if (secret) {
        await ctx.db.patch(secret._id, { ...secretPatch, updatedAt: now });
      } else {
        await ctx.db.insert("agentSecrets", {
          agentId: args.agentId,
          ...secretPatch,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.agentId, {
      // First write from a token-bearing browser claims a legacy row.
      ...(agent.ownerToken === undefined && token ? { ownerToken: token } : {}),
      name: args.name.trim(),
      model: args.model.trim(),
      instructions: args.instructions,
      tools: args.tools,
      timezone: args.timezone.trim(),
      schedule: args.schedule,
      channels: args.channels,
      hasGatewayKey,
      hasTelegramToken,
      hasComposioKey,
      hasConvexDeployKey,
      updatedAt: now,
    });
    return null;
  },
});

/** Queue a deploy job for the worker. No-op guard against double-queueing. */
export const requestDeploy = mutation({
  args: { ...dashboardAuthArgs, agentId: v.id("agents") },
  returns: v.id("deployJobs"),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const token = args.ownerToken?.trim() || undefined;
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    requireAgentOwner(agent, token);
    if (agent.status === "deleting") {
      throw new Error("Agent is being deleted");
    }

    const recent = await ctx.db
      .query("deployJobs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(5);
    const inFlight = recent.find(
      (j) => j.status === "pending" || j.status === "running",
    );
    if (inFlight) return inFlight._id;

    // Fail fast instead of parking the agent in "deploying" until the
    // pending-job reaper gives up. ConvexError so the message survives prod
    // redaction and reaches the dashboard.
    if (!agent.hasGatewayKey) {
      throw new ConvexError(
        "Add an AI Gateway API key before deploying — chat and schedules bill this key",
      );
    }

    if (!(await hasLiveWorker(ctx))) {
      throw new ConvexError(
        "No build worker is online — start platform/worker, then retry",
      );
    }

    const jobId = await ctx.db.insert("deployJobs", {
      agentId: args.agentId,
      kind: "deploy",
      status: "pending",
      logCount: 0,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.agentId, {
      // First write from a token-bearing browser claims a legacy row.
      ...(agent.ownerToken === undefined && token ? { ownerToken: token } : {}),
      status: "deploying",
      lastError: undefined,
      updatedAt: Date.now(),
    });
    return jobId;
  },
});

/**
 * Delete an agent.
 *
 * - Never-deployed agents (no Convex project behind them) vanish immediately.
 * - Deployed agents queue a teardown job: the worker scrubs the deployment's
 *   credentials (AI gateway key, webhook secret) so the orphaned project
 *   can't spend tokens or accept webhooks, then the builder purges the row.
 *   The Convex project itself stays (the CLI has no project-delete); the
 *   teardown log links the dashboard page for manual removal.
 */
export const remove = mutation({
  args: { ...dashboardAuthArgs, agentId: v.id("agents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null; // already gone — deleting is idempotent
    requireAgentOwner(agent, args.ownerToken?.trim() || undefined);
    if (agent.status === "deploying") {
      throw new Error(
        "Agent is deploying — wait for the deploy to finish before deleting",
      );
    }
    if (agent.status === "deleting") return null;

    // Teardown needs a worker; fail fast (before touching any state) rather
    // than locking the agent in "deleting" until the reaper gives up.
    if (agent.deploymentName && !(await hasLiveWorker(ctx))) {
      throw new ConvexError(
        "No build worker is online — start platform/worker, then retry",
      );
    }

    // Revoke stored credentials immediately on either path. The Convex
    // deploy key is kept until teardown finishes — the worker needs it to
    // scrub a bring-your-own-Convex deployment (purgeAgentRows removes it).
    const secret = await ctx.db
      .query("agentSecrets")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .unique();
    if (secret) {
      if (agent.deploymentName && secret.convexDeployKey) {
        await ctx.db.patch(secret._id, {
          aiGatewayApiKey: undefined,
          telegramBotToken: undefined,
          composioApiKey: undefined,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.delete(secret._id);
      }
    }

    if (!agent.deploymentName) {
      // Never provisioned — nothing to tear down remotely.
      await purgeAgentRows(ctx, args.agentId);
      return null;
    }

    await ctx.db.insert("deployJobs", {
      agentId: args.agentId,
      kind: "delete",
      status: "pending",
      logCount: 0,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.agentId, {
      status: "deleting",
      hasGatewayKey: false, // secrets row was just revoked
      lastError: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Force-fail the agent's in-flight job and unlock the agent. The escape
 * hatch for a stuck deploy/teardown (worker offline or wedged) — the cron
 * reaper handles most cases automatically, this is the immediate manual one.
 * If the worker is in fact still running the job, its eventual `complete`
 * is ignored (worker.complete only applies to jobs still in "running").
 */
export const cancelJob = mutation({
  args: { ...dashboardAuthArgs, agentId: v.id("agents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;
    requireAgentOwner(agent, args.ownerToken?.trim() || undefined);

    const now = Date.now();
    const recent = await ctx.db
      .query("deployJobs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(5);
    const inFlight = recent.find(
      (j) => j.status === "pending" || j.status === "running",
    );
    if (inFlight) {
      await ctx.db.patch(inFlight._id, {
        status: "failed",
        error: "Cancelled from the dashboard",
        finishedAt: now,
      });
    }
    if (agent.status === "deploying" || agent.status === "deleting") {
      await ctx.db.patch(agent._id, {
        status: "failed",
        lastError: "Cancelled from the dashboard",
        updatedAt: now,
      });
    }
    return null;
  },
});

const jobShape = v.object({
  _id: v.id("deployJobs"),
  _creationTime: v.number(),
  agentId: v.id("agents"),
  kind: v.optional(v.union(v.literal("deploy"), v.literal("delete"))),
  status: v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("succeeded"),
    v.literal("failed"),
  ),
  step: v.optional(v.string()),
  error: v.optional(v.string()),
  workerId: v.optional(v.string()),
  logCount: v.number(),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
});

export const latestJob = query({
  args: { ...dashboardAuthArgs, agentId: v.id("agents") },
  returns: v.union(jobShape, v.null()),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const agent = await ctx.db.get(args.agentId);
    if (!agent || !ownsAgent(agent, args.ownerToken?.trim() || undefined)) {
      return null;
    }
    return await ctx.db
      .query("deployJobs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .first();
  },
});

export const jobLogs = query({
  args: { ...dashboardAuthArgs, jobId: v.id("deployJobs") },
  returns: v.array(
    v.object({ seq: v.number(), line: v.string(), createdAt: v.number() }),
  ),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const job = await ctx.db.get(args.jobId);
    if (!job) return [];
    // Orphaned jobs (agent row already purged) belong to nobody — never
    // expose their logs.
    const agent = await ctx.db.get(job.agentId);
    if (!agent || !ownsAgent(agent, args.ownerToken?.trim() || undefined)) {
      return [];
    }
    // Deploy logs are bounded (worker truncates long lines, ~few hundred
    // rows per job); cap the read defensively.
    const rows = await ctx.db
      .query("jobLogs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .order("asc")
      .take(2000);
    return rows.map((r) => ({ seq: r.seq, line: r.line, createdAt: r.createdAt }));
  },
});

/** Dashboard needs to know whether a worker has polled recently. */
export const workerHeartbeat = query({
  args: { ...dashboardAuthArgs },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const doc = await ctx.db.query("workerHeartbeats").order("desc").first();
    return doc?.lastSeen ?? null;
  },
});

// Re-exported type helpers for the worker client.
export type AgentDoc = Doc<"agents">;
export type DeployJobId = Id<"deployJobs">;
