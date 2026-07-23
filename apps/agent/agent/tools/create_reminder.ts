import { defineTool } from "eve/tools";
import { z } from "zod";

import { nextCronOccurrence } from "../lib/cron";
import {
  backend,
  convexClient,
  defaultTimezone,
  serviceSecret,
  telegramChatId,
} from "../lib/convex";

export default defineTool({
  description:
    "Schedule a proactive reminder or task. You wake up at the given time (one-off) or on the cron cadence (recurring), perform the prompt, and report to the user. Use for 'remind me to X at 9pm', 'every weekday morning send me my schedule', or any future/recurring task.",
  inputSchema: z.object({
    prompt: z
      .string()
      .min(1)
      .max(4000)
      .describe(
        "Instruction to your future self when this fires: what to do or check, and what to report. Include any context needed - the fired session has no chat history.",
      ),
    fireAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .describe(
        "One-off: when to fire, ISO 8601 with offset (e.g. 2026-07-23T21:00:00-04:00).",
      ),
    cron: z
      .string()
      .optional()
      .describe(
        'Recurring: 5-field cron expression evaluated in the timezone (e.g. "0 21 * * *" for 9pm daily).',
      ),
    timezone: z
      .string()
      .optional()
      .describe("IANA timezone for the cron expression."),
  }),
  async execute({ prompt, fireAt, cron, timezone }, ctx) {
    if ((fireAt === undefined) === (cron === undefined)) {
      throw new Error(
        "Provide exactly one of fireAt (one-off) or cron (recurring).",
      );
    }
    const tz = timezone ?? defaultTimezone();

    let nextFireAt: Date;
    if (fireAt !== undefined) {
      nextFireAt = new Date(fireAt);
      if (nextFireAt.getTime() <= Date.now()) {
        throw new Error(`fireAt is in the past (${fireAt}). Pick a future time.`);
      }
    } else {
      try {
        nextFireAt = nextCronOccurrence(cron!, tz);
      } catch (error) {
        throw new Error(
          `Invalid cron expression "${cron}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Delivery follows origin: a reminder created from Telegram replies into
    // that DM; one created elsewhere lands in the dashboard inbox.
    const attributes = ctx.session.auth.current?.attributes ?? {};
    const reminder = (await convexClient().mutation(backend.remindersCreate, {
      secret: serviceSecret(),
      prompt,
      cron: cron ?? null,
      timezone: tz,
      nextFireAt: nextFireAt.getTime(),
      chatId: telegramChatId(attributes),
    })) as { id: string; nextFireAt: number; cron: string | null };

    return {
      id: reminder.id,
      nextFireAt: new Date(reminder.nextFireAt).toISOString(),
      recurring: reminder.cron !== null,
    };
  },
});
