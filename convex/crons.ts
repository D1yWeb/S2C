import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup job daily at 3 AM
crons.daily(
  "cleanup old deleted items",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.runCleanup
);

export default crons;

