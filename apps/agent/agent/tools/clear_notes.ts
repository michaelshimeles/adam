import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { backend, convexClient, serviceSecret } from "../lib/convex.js";

export default defineTool({
  description:
    "Delete ALL notes from the shared team notepad. Destructive; requires human approval.",
  inputSchema: z.object({}),
  approval: always(),
  async execute() {
    const deleted = await convexClient().mutation(backend.notesClear, {
      secret: serviceSecret(),
    });
    return { deleted };
  },
});
