import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireDashboardSecret } from "./lib";

const GATEWAY_ORIGIN = "https://ai-gateway.vercel.sh";
const OPENROUTER_ORIGIN = "https://openrouter.ai";

/**
 * Check a model API key before the agent is created/deployed, so a bad
 * credential surfaces in the form instead of as broken chat/scheduled
 * sessions after deploy. Both providers expose an authenticated GET that
 * answers 200 for any valid key: the gateway's credits endpoint (reports a
 * balance) and OpenRouter's key-info endpoint (reports the key's remaining
 * credit limit, when one is set). Runs server-side because neither endpoint
 * has browser CORS.
 */
export const validate = action({
  args: {
    dashboardSecret: v.optional(v.string()),
    /** Sent by the UI's shared auth args; unused (no agent involved). */
    ownerToken: v.optional(v.string()),
    apiKey: v.string(),
    /** Which service issued apiKey; omitted means "gateway". */
    provider: v.optional(
      v.union(v.literal("gateway"), v.literal("openrouter")),
    ),
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

    const provider = args.provider ?? "gateway";
    const target =
      provider === "openrouter"
        ? { url: `${OPENROUTER_ORIGIN}/api/v1/key`, label: "OpenRouter" }
        : { url: `${GATEWAY_ORIGIN}/v1/credits`, label: "The AI Gateway" };

    let response: Response;
    try {
      response = await fetch(target.url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      return { ok: false, error: `Could not reach ${target.label}.` };
    }
    if (!response.ok) {
      return {
        ok: false,
        error:
          response.status === 401 || response.status === 403
            ? `${target.label} rejected this key.`
            : `${target.label} returned ${response.status}.`,
      };
    }
    // A real response is a JSON object; anything else (an HTML error page,
    // an intercepting proxy) must not mark the key valid.
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, error: `${target.label} returned an invalid response.` };
    }
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, error: `${target.label} returned an unexpected response.` };
    }
    if (provider === "openrouter") {
      const data = (payload as { data?: { limit_remaining?: unknown } }).data;
      if (data === null || typeof data !== "object") {
        return { ok: false, error: "OpenRouter returned an unexpected response." };
      }
      const remaining = data.limit_remaining;
      return {
        ok: true,
        balance:
          typeof remaining === "number" && Number.isFinite(remaining)
            ? String(remaining)
            : undefined,
      };
    }
    const balance = (payload as Record<string, unknown>).balance;
    if (typeof balance === "string") return { ok: true, balance };
    if (typeof balance === "number" && Number.isFinite(balance)) {
      return { ok: true, balance: String(balance) };
    }
    return { ok: false, error: "The AI Gateway returned an unexpected response." };
  },
});
