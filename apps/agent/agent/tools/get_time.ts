import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Get the current date and time. Optionally pass an IANA timezone (e.g. 'America/New_York'); defaults to UTC.",
  inputSchema: z.object({
    timezone: z
      .string()
      .describe("IANA timezone name, e.g. 'America/Toronto'")
      .default("UTC"),
  }),
  async execute({ timezone }) {
    const now = new Date();
    let localized: string;
    try {
      localized = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        dateStyle: "full",
        timeStyle: "long",
      }).format(now);
    } catch {
      return {
        error: `Unknown timezone '${timezone}'. Use an IANA name like 'America/New_York'.`,
      };
    }
    return {
      iso: now.toISOString(),
      timezone,
      localized,
      epochMs: now.getTime(),
    };
  },
});
