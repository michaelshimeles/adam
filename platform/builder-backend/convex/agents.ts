import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { agentConfig } from "./schema";
import { purgeAgentRows, slugify } from "./lib";

/**
 * Public UI surface for the builder dashboard.
 *
 * NOTE: like the agent backend's demo endpoints, these are intentionally
 * unauthenticated for the prototype — the builder runs as a single-tenant
 * demo. A real product would wrap these in authed custom functions and
 * scope agents to their owner.
 */

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
  projectSlug: v.optional(v.string()),
  deploymentName: v.optional(v.string()),
  deploymentUrl: v.optional(v.string()),
  dashboardUrl: v.optional(v.string()),
  bundleVersion: v.optional(v.string()),
  /**
   * Shared secret callers put in x-webhook-secret. Exposing it to the
   * dashboard is the point (users wire it into their external systems);
   * the builder is a single-tenant demo — a real product would show it
   * only to the agent's owner.
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
  }),
  schedule: v.object({
    enabled: v.boolean(),
    cron: v.string(),
    prompt: v.string(),
  }),
  channels: v.object({
    webhook: v.object({ enabled: v.boolean() }),
  }),
};

function validateConfig(args: {
  name: string;
  model: string;
  instructions: string;
  schedule: { enabled: boolean; cron: string; prompt: string };
}): void {
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

export const list = query({
  args: {},
  returns: v.array(agentSummary),
  handler: async (ctx) => {
    // Single-tenant demo dashboard: the agent list is small and bounded.
    const agents = await ctx.db.query("agents").order("desc").take(100);
    return agents;
  },
});

export const get = query({
  args: { agentId: v.id("agents") },
  returns: v.union(agentSummary, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

export const create = mutation({
  args: {
    ...configArgs,
    aiGatewayApiKey: v.optional(v.string()),
  },
  returns: v.id("agents"),
  handler: async (ctx, args) => {
    validateConfig(args);
    const now = Date.now();
    const key = args.aiGatewayApiKey?.trim();
    const agentId = await ctx.db.insert("agents", {
      name: args.name.trim(),
      slug: slugify(args.name),
      model: args.model.trim(),
      instructions: args.instructions,
      tools: args.tools,
      schedule: args.schedule,
      channels: args.channels,
      status: "draft",
      hasGatewayKey: Boolean(key),
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("agentSecrets", {
      agentId,
      aiGatewayApiKey: key || undefined,
      updatedAt: now,
    });
    return agentId;
  },
});

export const update = mutation({
  args: {
    agentId: v.id("agents"),
    ...configArgs,
    /** Omit to keep the stored key; pass a value to replace it; "" clears. */
    aiGatewayApiKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    if (agent.status === "deploying") {
      throw new Error("Agent is deploying — wait for the current deploy to finish");
    }
    if (agent.status === "deleting") {
      throw new Error("Agent is being deleted");
    }
    validateConfig(args);
    const now = Date.now();

    let hasGatewayKey = agent.hasGatewayKey;
    if (args.aiGatewayApiKey !== undefined) {
      const key = args.aiGatewayApiKey.trim();
      const secret = await ctx.db
        .query("agentSecrets")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .unique();
      if (secret) {
        await ctx.db.patch(secret._id, {
          aiGatewayApiKey: key || undefined,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("agentSecrets", {
          agentId: args.agentId,
          aiGatewayApiKey: key || undefined,
          updatedAt: now,
        });
      }
      hasGatewayKey = Boolean(key);
    }

    await ctx.db.patch(args.agentId, {
      name: args.name.trim(),
      model: args.model.trim(),
      instructions: args.instructions,
      tools: args.tools,
      schedule: args.schedule,
      channels: args.channels,
      hasGatewayKey,
      updatedAt: now,
    });
    return null;
  },
});

/** Queue a deploy job for the worker. No-op guard against double-queueing. */
export const requestDeploy = mutation({
  args: { agentId: v.id("agents") },
  returns: v.id("deployJobs"),
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
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

    const jobId = await ctx.db.insert("deployJobs", {
      agentId: args.agentId,
      kind: "deploy",
      status: "pending",
      logCount: 0,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.agentId, {
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
  args: { agentId: v.id("agents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null; // already gone — deleting is idempotent
    if (agent.status === "deploying") {
      throw new Error(
        "Agent is deploying — wait for the deploy to finish before deleting",
      );
    }
    if (agent.status === "deleting") return null;

    // Revoke stored credentials immediately on either path.
    const secret = await ctx.db
      .query("agentSecrets")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .unique();
    if (secret) await ctx.db.delete(secret._id);

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
  args: { agentId: v.id("agents") },
  returns: v.union(jobShape, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployJobs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .first();
  },
});

export const jobLogs = query({
  args: { jobId: v.id("deployJobs") },
  returns: v.array(
    v.object({ seq: v.number(), line: v.string(), createdAt: v.number() }),
  ),
  handler: async (ctx, args) => {
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
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    const doc = await ctx.db.query("workerHeartbeats").order("desc").first();
    return doc?.lastSeen ?? null;
  },
});

// Re-exported type helpers for the worker client.
export type AgentDoc = Doc<"agents">;
export type DeployJobId = Id<"deployJobs">;
