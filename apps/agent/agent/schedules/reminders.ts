import { defineSchedule } from "eve/schedules";

import proactive from "../channels/proactive";
import telegram from "../channels/telegram";
import { nextCronOccurrence } from "../lib/cron";
import { backend, convexClient, serviceSecret } from "../lib/convex";

/**
 * Dispatcher for agent-created reminders (the Convex `reminders` table; see
 * the create_reminder tool). A Convex cron fires this every minute through
 * runner/schedule:reminders; it claims due rows and runs one proactive
 * session per reminder. Delivery follows where the reminder was created:
 * rows with a Telegram chat id reply into that DM; rows without one run on
 * the proactive channel and land in the dashboard inbox.
 */

interface ReminderRow {
  id: string;
  prompt: string;
  cron: string | null;
  timezone: string;
  chatId: string | null;
}

function reminderMessage(reminder: ReminderRow): string {
  const cadence =
    reminder.cron === null
      ? "a one-off reminder"
      : `a recurring task (cron "${reminder.cron}", ${reminder.timezone})`;
  return [
    `Scheduled ${cadence} you set earlier (id ${reminder.id}) just fired. Its instruction:`,
    "",
    reminder.prompt,
    "",
    "Carry it out now and report the result. The user didn't just message you - this is proactive, so lead with what this is about.",
  ].join("\n");
}

function clipTitle(title: string): string {
  const oneLine = title.replaceAll("\n", " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 60).trimEnd()}…` : oneLine;
}

export default defineSchedule({
  cron: "* * * * *",
  async run({ receive, waitUntil, appAuth }) {
    const convex = convexClient();
    const due = (await convex.mutation(backend.remindersClaimDue, {
      secret: serviceSecret(),
    })) as ReminderRow[];

    for (const reminder of due) {
      waitUntil(
        (async () => {
          try {
            const message = reminderMessage(reminder);
            if (reminder.chatId !== null) {
              await receive(telegram, {
                message,
                target: { chatId: reminder.chatId },
                auth: appAuth,
              });
            } else {
              const session = await receive(proactive, {
                message,
                target: {},
                auth: appAuth,
              });
              await convex.mutation(backend.inboxAdd, {
                secret: serviceSecret(),
                sessionId: session.id,
                title: `Reminder: ${clipTitle(reminder.prompt)}`,
                kind: "reminder",
              });
            }
            await convex.mutation(backend.remindersComplete, {
              secret: serviceSecret(),
              id: reminder.id,
              ...(reminder.cron !== null
                ? {
                    nextFireAt: nextCronOccurrence(
                      reminder.cron,
                      reminder.timezone,
                    ).getTime(),
                  }
                : {}),
            });
          } catch (error) {
            console.error(
              `Reminder ${reminder.id} delivery failed; releasing for retry.`,
              error,
            );
            await convex.mutation(backend.remindersRelease, {
              secret: serviceSecret(),
              id: reminder.id,
            });
          }
        })(),
      );
    }
  },
});
