import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  backend,
  convexClient,
  serviceSecret,
  triggerUrl,
} from "../lib/convex";

export default defineTool({
  description:
    "List all event triggers (webhooks) with their ids, names, URLs, and fire counts.",
  inputSchema: z.object({}),
  async execute() {
    const hooks = (await convexClient().mutation(backend.triggersListFull, {
      secret: serviceSecret(),
    })) as Array<{
      hookId: string;
      secret: string;
      name: string;
      prompt: string;
      fireCount: number;
      lastFiredAt: number | null;
    }>;
    return {
      webhooks: hooks.map((hook) => ({
        id: hook.hookId,
        name: hook.name,
        prompt: hook.prompt,
        url: triggerUrl(hook),
        fireCount: hook.fireCount,
        lastFiredAt:
          hook.lastFiredAt === null
            ? null
            : new Date(hook.lastFiredAt).toISOString(),
      })),
    };
  },
});
