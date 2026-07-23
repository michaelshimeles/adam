import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Delete an event trigger (webhook) by id (from list_webhooks). Its URL stops working immediately.",
  inputSchema: z.object({
    id: z.string().min(1).describe("The webhook id to delete"),
  }),
  async execute({ id }) {
    const deleted = await convexClient().mutation(backend.triggersRemove, {
      secret: serviceSecret(),
      hookId: id,
    });
    return { deleted };
  },
});
