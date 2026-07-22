import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient } from "../lib/convex";

export default defineTool({
  description:
    "Search long-term memory for facts about the user. Use when they reference something not covered by your injected memory profile, before saying you do not know.",
  inputSchema: z.object({
    query: z.string().min(1).describe("What to look for, phrased as keywords"),
  }),
  async execute({ query }) {
    const results = await convexClient().query(backend.memoriesSearch, {
      query,
    });
    return { results };
  },
});
