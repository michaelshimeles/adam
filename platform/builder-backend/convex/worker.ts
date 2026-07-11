import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { agentConfig } from "./schema";
import { purgeAgentRows, requireWorkerSecret } from "./lib";

/**
 * Worker-facing API. The build worker polls `claim`, streams progress via
 * `setStep`/`appendLogs`, and finishes with `complete`. All calls are gated
 * by PLATFORM_WORKER_SECRET (see lib.ts).
 */

/** Claim the oldest pending job (deploy or delete), oldest first. */
export const claim = mutation({
  args: { secret: v.string(), workerId: v.string() },
  returns: v.union(
    v.object({
      kind: v.literal("deploy"),
      jobId: v.id("deployJobs"),
      agentId: v.id("agents"),
      config: v.object(agentConfig),
      /** Deployment credential (never exposed to the browser). */
      aiGatewayApiKey: v.optional(v.string()),
      /** Existing webhook secret, reused on redeploy. */
      webhookSecret: v.optional(v.string()),
      /** Present on redeploys — pipeline skips provisioning. */
      existing: v.optional(
        v.object({
          projectSlug: v.string(),
          deploymentName: v.string(),
          deploymentUrl: v.string(),
        }),
      ),
    }),
    /** Teardown: scrub the deployment's credentials, then complete. */
    v.object({
      kind: v.literal("delete"),
      jobId: v.id("deployJobs"),
      agentId: v.id("agents"),
      name: v.string(),
      projectSlug: v.optional(v.string()),
      deploymentName: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    requireWorkerSecret(args.secret);
    const now = Date.now();

    // Heartbeat upsert so the UI can show worker liveness.
    const hb = await ctx.db
      .query("workerHeartbeats")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .unique();
    if (hb) {
      await ctx.db.patch(hb._id, { lastSeen: now });
    } else {
      await ctx.db.insert("workerHeartbeats", {
        workerId: args.workerId,
        lastSeen: now,
      });
    }

    const job = await ctx.db
      .query("deployJobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .first();
    if (!job) return null;

    const agent = await ctx.db.get(job.agentId);
    if (!agent) {
      await ctx.db.patch(job._id, {
        status: "failed",
        error: "Agent was deleted",
        finishedAt: now,
      });
      return null;
    }

    await ctx.db.patch(job._id, {
      status: "running",
      workerId: args.workerId,
      startedAt: now,
      step: "claimed",
    });

    if (job.kind === "delete") {
      return {
        kind: "delete" as const,
        jobId: job._id,
        agentId: agent._id,
        name: agent.name,
        projectSlug: agent.projectSlug,
        deploymentName: agent.deploymentName,
      };
    }

    const secretRow = await ctx.db
      .query("agentSecrets")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .unique();

    const existing =
      agent.projectSlug && agent.deploymentName && agent.deploymentUrl
        ? {
            projectSlug: agent.projectSlug,
            deploymentName: agent.deploymentName,
            deploymentUrl: agent.deploymentUrl,
          }
        : undefined;

    return {
      kind: "deploy" as const,
      jobId: job._id,
      agentId: agent._id,
      config: {
        name: agent.name,
        slug: agent.slug,
        model: agent.model,
        instructions: agent.instructions,
        // Framework web tools default ON for rows created before the toggles.
        tools: {
          ...agent.tools,
          webFetch: agent.tools.webFetch ?? true,
          webSearch: agent.tools.webSearch ?? true,
        },
        schedule: agent.schedule,
        channels: agent.channels ?? { webhook: { enabled: false } },
      },
      aiGatewayApiKey: secretRow?.aiGatewayApiKey,
      /** Reused on redeploy so the caller-facing secret stays stable. */
      webhookSecret: agent.webhookSecret,
      existing,
    };
  },
});

export const setStep = mutation({
  args: { secret: v.string(), jobId: v.id("deployJobs"), step: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireWorkerSecret(args.secret);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "running") return null;
    await ctx.db.patch(args.jobId, { step: args.step });
    return null;
  },
});

export const appendLogs = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("deployJobs"),
    lines: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireWorkerSecret(args.secret);
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const now = Date.now();
    let seq = job.logCount;
    for (const line of args.lines) {
      await ctx.db.insert("jobLogs", {
        jobId: args.jobId,
        seq,
        // Defensive cap; the worker already truncates.
        line: line.slice(0, 4000),
        createdAt: now,
      });
      seq += 1;
    }
    await ctx.db.patch(args.jobId, { logCount: seq });
    return null;
  },
});

export const complete = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("deployJobs"),
    ok: v.boolean(),
    error: v.optional(v.string()),
    result: v.optional(
      v.object({
        projectSlug: v.string(),
        deploymentName: v.string(),
        deploymentUrl: v.string(),
        dashboardUrl: v.string(),
        bundleVersion: v.string(),
        /** Set when the webhook channel is enabled; absent clears it. */
        webhookSecret: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireWorkerSecret(args.secret);
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const now = Date.now();

    if (job.kind === "delete") {
      if (args.ok) {
        // Teardown done — the agent and all its rows (this job included)
        // disappear in one transaction.
        await purgeAgentRows(ctx, job.agentId);
      } else {
        await ctx.db.patch(args.jobId, {
          status: "failed",
          error: args.error,
          finishedAt: now,
        });
        const agent = await ctx.db.get(job.agentId);
        if (agent) {
          await ctx.db.patch(agent._id, {
            status: "failed",
            lastError: args.error ?? "Delete failed",
            updatedAt: now,
          });
        }
      }
      return null;
    }

    await ctx.db.patch(args.jobId, {
      status: args.ok ? "succeeded" : "failed",
      error: args.error,
      step: args.ok ? "done" : job.step,
      finishedAt: now,
    });

    const agent = await ctx.db.get(job.agentId);
    if (!agent) return null;

    if (args.ok && args.result) {
      await ctx.db.patch(agent._id, {
        status: "live",
        projectSlug: args.result.projectSlug,
        deploymentName: args.result.deploymentName,
        deploymentUrl: args.result.deploymentUrl,
        dashboardUrl: args.result.dashboardUrl,
        bundleVersion: args.result.bundleVersion,
        webhookSecret: args.result.webhookSecret,
        lastDeployedAt: now,
        lastError: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(agent._id, {
        status: "failed",
        lastError: args.error ?? "Deploy failed",
        updatedAt: now,
      });
    }
    return null;
  },
});
