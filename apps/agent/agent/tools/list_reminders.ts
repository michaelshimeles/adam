import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient } from "../lib/convex";

export default defineTool({
  description:
    "List all active reminders and scheduled tasks, with ids, prompts, cadence, and next fire time.",
  inputSchema: z.object({}),
  async execute() {
    const reminders = (await convexClient().query(backend.remindersList, {})) as Array<{
      id: string;
      prompt: string;
      cron: string | null;
      timezone: string;
      nextFireAt: number;
    }>;
    return {
      reminders: reminders.map((row) => ({
        ...row,
        nextFireAt: new Date(row.nextFireAt).toISOString(),
      })),
    };
  },
});
