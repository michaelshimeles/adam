import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireDashboardSecret } from "./lib";

const GATEWAY_ORIGIN = "https://ai-gateway.vercel.sh";

/**
 * Check an AI Gateway key before the agent is created/deployed, so a bad
 * credential surfaces in the form instead of as a broken scheduled session
 * after deploy. The gateway's credits endpoint answers 200 (with a balance)
 * for any valid key. Runs server-side because the endpoint has no browser
 * CORS.
 */
export const validate = action({
  args: {
    dashboardSecret: v.optional(v.string()),
    apiKey: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    balance: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    requireDashboardSecret(args.dashboardSecret);
    const apiKey = args.apiKey.trim();
    if (!apiKey) return { ok: false, error: "Enter an API key." };

    let response: Response;
    try {
      response = await fetch(`${GATEWAY_ORIGIN}/v1/credits`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      return { ok: false, error: "Could not reach the AI Gateway." };
    }
    if (!response.ok) {
      return {
        ok: false,
        error:
          response.status === 401 || response.status === 403
            ? "The AI Gateway rejected this key."
            : `The AI Gateway returned ${response.status}.`,
      };
    }
    try {
      const json = (await response.json()) as { balance?: unknown };
      return {
        ok: true,
        balance: typeof json.balance === "string" ? json.balance : undefined,
      };
    } catch {
      return { ok: true };
    }
  },
});
