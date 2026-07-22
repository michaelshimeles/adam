import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Delete one long-term memory by id. Find the id first with search_memory or list_memories. Use when the user asks you to forget something or a saved fact is clearly obsolete.",
  inputSchema: z.object({
    memoryId: z.string().min(1).describe("The memory id to delete"),
  }),
  async execute({ memoryId }) {
    const deleted = await convexClient().mutation(backend.memoriesRemove, {
      secret: serviceSecret(),
      id: memoryId,
    });
    return { deleted };
  },
});
