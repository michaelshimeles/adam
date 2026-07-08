import { defineTool } from "eve/tools";
import { z } from "zod";
import { backend, convexClient } from "../lib/convex.js";

export default defineTool({
  description:
    "List saved notes from the shared team notepad, newest first.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(100).default(20),
  }),
  async execute({ limit }) {
    const notes = await convexClient().query(backend.notesList, { limit });
    return { notes };
  },
});
