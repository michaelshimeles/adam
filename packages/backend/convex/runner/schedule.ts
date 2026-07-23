"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, type ActionCtx } from "../_generated/server";
import { loadEveBundle } from "./bundle";

/**
 * Dispatches eve schedules (agent/schedules/*) through the bundled runtime.
 * The eve server ran these on an in-process croner; here Convex crons
 * (crons.ts) trigger them instead. Sessions started by a schedule become
 * normal durable runs executed by runner/engine:tick.
 */

function scheduleTaskName(schedulePath: string): string {
  // Matches eve's nitro task naming: eve.schedule.<base64url(source path)>
  return `eve.schedule.${Buffer.from(schedulePath, "utf-8").toString("base64url")}`;
}

async function dispatchSchedule(
  ctx: ActionCtx,
  schedulePath: string,
): Promise<{ sessionIds: string[] }> {
  const { bundle } = await loadEveBundle(ctx);
  if (typeof bundle.dispatchScheduleTask !== "function") {
    throw new Error(
      `this agent bundle was built without schedules — remove the cron for ` +
        `${schedulePath} or add the schedule file and rebuild`,
    );
  }
  const result = (await bundle.dispatchScheduleTask(
    scheduleTaskName(schedulePath),
    { dev: false },
  )) as { scheduleId: string; sessionIds: string[] };
  // BYOK: schedule sessions are deployment-initiated — mark them so the
  // runner executes them on the deployment's own credentials instead of
  // holding them for a visitor key that will never arrive.
  for (const sessionId of result.sessionIds) {
    await ctx.runMutation(internal.keys.markSystem, { sessionId });
  }
  return { sessionIds: result.sessionIds };
}

const scheduleResult = v.object({ sessionIds: v.array(v.string()) });

export const heartbeat = internalAction({
  args: {},
  returns: scheduleResult,
  handler: (ctx) => dispatchSchedule(ctx, "schedules/heartbeat.md"),
});

/** Minute-level dispatcher for agent-created reminders (reminders table). */
export const reminders = internalAction({
  args: {},
  returns: scheduleResult,
  handler: (ctx) => dispatchSchedule(ctx, "schedules/reminders.ts"),
});

/** Nightly long-term-memory consolidation pass (memories table). */
export const memoryConsolidation = internalAction({
  args: {},
  returns: scheduleResult,
  handler: (ctx) => dispatchSchedule(ctx, "schedules/memory-consolidation.md"),
});
