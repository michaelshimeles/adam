import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Cancel an active reminder or recurring task by id (from list_reminders). When the user changes a recurring task, cancel the old one and create the new version.",
  inputSchema: z.object({
    id: z.string().min(1).describe("The reminder id to cancel"),
  }),
  async execute({ id }) {
    const cancelled = await convexClient().mutation(backend.remindersCancel, {
      secret: serviceSecret(),
      id,
    });
    return { cancelled: cancelled !== null };
  },
});
