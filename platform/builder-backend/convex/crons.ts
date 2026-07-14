import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Recover jobs that will never finish (worker offline, crashed, or hung) so
// agents don't stay locked in "deploying"/"deleting".
crons.interval(
  "reap stale deploy jobs",
  { minutes: 1 },
  internal.worker.reapStale,
  {},
);

export default crons;
