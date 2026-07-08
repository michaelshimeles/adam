import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Lease recovery: a crashed pump leaves jobs in `claimed` past their lease.
crons.interval(
  "requeue expired queue leases",
  { minutes: 1 },
  internal.world.queue.requeueExpired,
  {},
);

// Keep the dead-letter set bounded.
crons.daily(
  "cleanup dead queue jobs",
  { hourUTC: 4, minuteUTC: 0 },
  internal.world.queue.cleanupDead,
  {},
);

export default crons;
