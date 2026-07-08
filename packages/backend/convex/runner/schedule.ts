"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { loadEveBundle } from "./bundle";

/**
 * Dispatches eve markdown schedules (agent/schedules/*.md) through the
 * bundled runtime. The eve server ran these on an in-process croner; here a
 * Convex cron (crons.ts) triggers them instead. Sessions started by a
 * schedule become normal durable runs executed by runner/engine:tick.
 */

function scheduleTaskName(schedulePath: string): string {
  // Matches eve's nitro task naming: eve.schedule.<base64url(source path)>
  return `eve.schedule.${Buffer.from(schedulePath, "utf-8").toString("base64url")}`;
}

export const heartbeat = internalAction({
  args: {},
  returns: v.object({ sessionIds: v.array(v.string()) }),
  handler: async () => {
    const { bundle } = await loadEveBundle();
    const result = (await bundle.dispatchScheduleTask(
      scheduleTaskName("schedules/heartbeat.md"),
      { dev: false },
    )) as { scheduleId: string; sessionIds: string[] };
    return { sessionIds: result.sessionIds };
  },
});
