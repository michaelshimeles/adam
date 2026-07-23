import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Create or update a reusable skill: a named procedure you will follow in future conversations. Use when the user describes a repeatable workflow, routine, or format they want you to apply again later. Saving with an existing name overwrites that skill. The skill takes effect in new conversations from then on.",
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9][a-z0-9_-]*$/)
      .describe("Stable slug, e.g. 'weekly_review' or 'trip-packing'"),
    description: z
      .string()
      .min(1)
      .max(300)
      .describe(
        "Routing hint written as the task that should trigger this skill, e.g. 'Use when the user asks for their weekly review.'",
      ),
    markdown: z
      .string()
      .min(1)
      .max(8000)
      .describe("The full procedure to follow, written as markdown instructions"),
  }),
  async execute({ name, description, markdown }) {
    await convexClient().mutation(backend.skillsPut, {
      secret: serviceSecret(),
      name,
      description,
      markdown,
    });
    return { saved: true, name };
  },
});
