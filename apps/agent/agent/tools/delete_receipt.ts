import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";

export default defineTool({
  description:
    "Delete one logged receipt by its id. Use to correct a mistaken or duplicate entry; find the id with query_receipts first.",
  inputSchema: z.object({
    id: z.string().min(1).describe("Receipt id from query_receipts"),
  }),
  async execute({ id }) {
    const deleted = await convexClient().mutation(backend.receiptsRemove, {
      secret: serviceSecret(),
      id,
    });
    return { deleted };
  },
});
