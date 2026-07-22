import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Lease recovery: a crashed worker leaves jobs in `claimed` past their lease.
crons.interval(
  "requeue expired queue leases",
  { minutes: 1 },
  internal.world.queue.requeueExpired,
  {},
);

// Convex-mode safety net: wake the runner if a scheduled tick was lost
// (e.g. functions replaced mid-flight by a deploy).
crons.interval(
  "sweep due queue jobs",
  { minutes: 1 },
  internal.world.queue.sweepDue,
  {},
);

// eve markdown schedule (agent/schedules/heartbeat.md) — hourly, matching
// the cron the eve server would have registered ("0 * * * *").
crons.hourly(
  "eve heartbeat schedule",
  { minuteUTC: 0 },
  internal.runner.schedule.heartbeat,
  {},
);

// eve reminders schedule (agent/schedules/reminders.ts) — every minute,
// claims due reminders and delivers proactive sessions.
crons.interval(
  "eve reminders schedule",
  { minutes: 1 },
  internal.runner.schedule.reminders,
  {},
);

// eve memory-consolidation schedule (agent/schedules/memory-consolidation.md)
// — nightly, matching its "15 8 * * *" cron.
crons.daily(
  "eve memory consolidation schedule",
  { hourUTC: 8, minuteUTC: 15 },
  internal.runner.schedule.memoryConsolidation,
  {},
);

// Keep the dead-letter set bounded.
crons.daily(
  "cleanup dead queue jobs",
  { hourUTC: 4, minuteUTC: 0 },
  internal.world.queue.cleanupDead,
  {},
);

// Drop stale BYOK session keys so visitor credentials don't accumulate.
crons.daily(
  "cleanup stale session keys",
  { hourUTC: 4, minuteUTC: 30 },
  internal.keys.cleanup,
  {},
);

export default crons;
