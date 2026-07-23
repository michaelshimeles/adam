import { CronExpressionParser } from "cron-parser";

/** Next occurrence strictly after `after`. Throws on an invalid expression. */
export function nextCronOccurrence(
  cron: string,
  timezone: string,
  after = new Date(),
): Date {
  return CronExpressionParser.parse(cron, {
    tz: timezone,
    currentDate: after,
  })
    .next()
    .toDate();
}
