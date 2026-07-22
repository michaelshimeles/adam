import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Save one long-term memory that persists across all future conversations. Use for durable facts and preferences about the user (name, city, habits, likes, ongoing projects). Phrase it entity-centric, e.g. 'User prefers metric units'. Never save secrets, passwords, tokens, or payment details.",
  inputSchema: z.object({
    memory: z
      .string()
      .min(1)
      .max(4000)
      .describe("The fact to remember, phrased plainly and entity-centric"),
    permanent: z
      .boolean()
      .default(false)
      .describe(
        "True for stable traits that rarely change (name, city, family, profession); false for recent or evolving context",
      ),
  }),
  async execute({ memory, permanent }) {
    const id = await convexClient().mutation(backend.memoriesAdd, {
      secret: serviceSecret(),
      content: memory,
      permanent,
    });
    return { id };
  },
});
