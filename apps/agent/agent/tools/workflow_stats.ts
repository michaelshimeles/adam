import { defineTool } from "eve/tools";
import { z } from "zod";
import { backend, convexClient } from "../lib/convex.js";

export default defineTool({
  description:
    "Report the agent's own durable state: recent workflow runs and queue health from the Convex world backend.",
  inputSchema: z.object({
    runLimit: z.number().int().min(1).max(50).default(10),
  }),
  async execute({ runLimit }) {
    const client = convexClient();
    const [queue, runs] = await Promise.all([
      client.query(backend.queueHealth, {}),
      client.query(backend.listRuns, { limit: runLimit }),
    ]);
    return { queue, recentRuns: runs };
  },
});
