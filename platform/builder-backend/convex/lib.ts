/** Shared guards/helpers for the builder backend. */

import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Constant-time string comparison for shared secrets (content-independent
 * timing; length still leaks, which is fine for random tokens).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    // charCodeAt is NaN out of range; ^ coerces NaN to 0.
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Require the platform worker secret (PLATFORM_WORKER_SECRET env var on this
 * deployment). Same trust model as the agent backend's WORLD_SERVICE_SECRET:
 * worker functions are public endpoints, gated by a bearer-style shared
 * secret argument.
 */
export function requireWorkerSecret(secret: string): void {
  const expected = process.env.PLATFORM_WORKER_SECRET;
  if (!expected) {
    throw new Error("PLATFORM_WORKER_SECRET is not configured on this deployment");
  }
  if (!timingSafeEqual(secret, expected)) {
    throw new Error("Invalid worker secret");
  }
}

/**
 * Optional access gate for the dashboard API (`agents:*`). When the
 * BUILDER_DASHBOARD_SECRET env var is set on the deployment, every dashboard
 * call must carry the matching secret (the web UI asks for it once and keeps
 * it in localStorage). When unset — local dev, throwaway demos — the
 * dashboard stays open, matching the original single-tenant behavior.
 */
export function requireDashboardSecret(secret: string | undefined): void {
  const expected = process.env.BUILDER_DASHBOARD_SECRET;
  if (!expected) return; // gate disabled
  if (!secret || !timingSafeEqual(secret, expected)) {
    // ConvexError so the message survives prod redaction — the web UI keys
    // its unlock screen off this exact string.
    throw new ConvexError("Invalid dashboard secret");
  }
}

/**
 * Delete an agent row and everything referencing it: secrets, deploy jobs,
 * job logs. Bounded data (one secrets row, a handful of jobs, worker-capped
 * logs per job), so full collects are fine here.
 */
export async function purgeAgentRows(
  ctx: MutationCtx,
  agentId: Id<"agents">,
): Promise<void> {
  const secret = await ctx.db
    .query("agentSecrets")
    .withIndex("by_agent", (q) => q.eq("agentId", agentId))
    .unique();
  if (secret) await ctx.db.delete(secret._id);

  const jobs = await ctx.db
    .query("deployJobs")
    .withIndex("by_agent", (q) => q.eq("agentId", agentId))
    .collect();
  for (const job of jobs) {
    const logs = await ctx.db
      .query("jobLogs")
      .withIndex("by_job", (q) => q.eq("jobId", job._id))
      .collect();
    for (const line of logs) {
      await ctx.db.delete(line._id);
    }
    await ctx.db.delete(job._id);
  }

  const agent = await ctx.db.get(agentId);
  if (agent) await ctx.db.delete(agentId);
}

/** Lowercase-alnum-dash slug from a display name, capped for project names. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "");
  return slug.length > 0 ? slug : "agent";
}
