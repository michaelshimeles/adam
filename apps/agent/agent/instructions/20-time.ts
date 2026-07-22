import { defineDynamic, defineInstructions } from "eve/instructions";

import { defaultTimezone } from "../lib/convex";

function currentTimeBlock(): string {
  const timezone = defaultTimezone();
  const now = new Date().toLocaleString("en-CA", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  });
  return `Current date and time: ${now} (${timezone}).`;
}

// Kept on turn.started (cheap and synchronous) so the time stays fresh each
// turn while the slower memory profile resolves per session.
export default defineDynamic({
  events: {
    "turn.started": () => defineInstructions({ markdown: currentTimeBlock() }),
  },
});
