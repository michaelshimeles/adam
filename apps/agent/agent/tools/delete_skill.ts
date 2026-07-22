import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Delete a saved skill by name. Use when the user asks, or offer it when a skill is clearly obsolete.",
  inputSchema: z.object({
    name: z.string().min(1).max(50).describe("The skill's slug"),
  }),
  async execute({ name }) {
    const deleted = await convexClient().mutation(backend.skillsRemove, {
      secret: serviceSecret(),
      name,
    });
    return { deleted };
  },
});
