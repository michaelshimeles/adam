import { defineTool } from "eve/tools";
import { z } from "zod";
import { backend, convexClient, serviceSecret } from "../lib/convex.js";

export default defineTool({
  description:
    "Save a note to the shared team notepad (a live Convex table everyone can see). Use for decisions, reminders, and findings worth keeping.",
  inputSchema: z.object({
    text: z.string().min(1).max(4000).describe("The note, self-contained"),
  }),
  async execute({ text }, ctx) {
    const id = await convexClient().mutation(backend.notesAdd, {
      secret: serviceSecret(),
      text,
      author: ctx.session.id,
    });
    return { saved: true, id };
  },
});
