import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  backend,
  convexClient,
  serviceSecret,
  telegramChatId,
  triggerUrl,
} from "../lib/convex";

export default defineTool({
  description:
    "Create an event trigger: a webhook URL that wakes you when an external service POSTs to it (deploy failed, form submitted, payment received, email rule matched). You receive the payload, follow the stored instruction, and report to the user. Give them the returned URL to paste into the service.",
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(120)
      .describe(
        'Short human label for what sends to this hook, e.g. "Vercel deploy alerts".',
      ),
    prompt: z
      .string()
      .min(1)
      .max(4000)
      .describe(
        "Instruction to your future self when an event arrives: how to interpret the payload, what to check or do, and what to report. The fired session has no chat history, so include all context.",
      ),
  }),
  async execute({ name, prompt }, ctx) {
    // Delivery follows origin: a hook created from Telegram reports into that
    // DM; one created elsewhere lands in the dashboard inbox.
    const attributes = ctx.session.auth.current?.attributes ?? {};
    const hook = (await convexClient().mutation(backend.triggersCreate, {
      secret: serviceSecret(),
      name,
      prompt,
      chatId: telegramChatId(attributes),
    })) as { hookId: string; secret: string; name: string };

    return {
      id: hook.hookId,
      name: hook.name,
      url: triggerUrl(hook),
      note: "Anyone with this URL can trigger the hook; treat it like a password.",
    };
  },
});
