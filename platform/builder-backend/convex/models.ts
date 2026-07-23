import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { ownsAgent, requireDashboardSecret } from "./lib";

/**
 * Model catalog for the builder form's model picker — same sources as the
 * deployed agent's picker (packages/backend/convex/models.ts). Fetched
 * server-side because neither provider's catalog endpoint allows browser
 * CORS. The caller either supplies the key it just typed in the form, or an
 * agentId whose STORED credential is used server-side (never sent to the
 * browser).
 */

const GATEWAY_ORIGIN = "https://ai-gateway.vercel.sh";
const OPENROUTER_ORIGIN = "https://openrouter.ai";

const providerValidator = v.union(
  v.literal("gateway"),
  v.literal("openrouter"),
);

const modelOption = v.object({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  pricing: v.optional(v.object({ input: v.string(), output: v.string() })),
});

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  pricing?: { input: string; output: string };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Accepts numbers or numeric strings (OpenRouter sends strings). */
function asPrice(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.length > 0 && Number.isFinite(Number(value))) {
    return value;
  }
  return undefined;
}

function parseCatalog(json: unknown): ModelOption[] {
  const root = json as { models?: unknown; data?: unknown } | null;
  const rows = Array.isArray(root?.models)
    ? root.models
    : Array.isArray(root?.data)
      ? root.data
      : [];
  const options: ModelOption[] = [];
  for (const row of rows) {
    if (row === null || typeof row !== "object") continue;
    const entry = row as Record<string, unknown>;
    const id = asString(entry.id);
    if (!id) continue;
    // Both catalogs tag non-chat entries (embeddings, images) — `type` in
    // the gateway's /v1/models, `modelType` in its legacy config catalog.
    const modelType = asString(entry.modelType) ?? asString(entry.type);
    if (modelType !== undefined && modelType !== "language") continue;
    const pricingRaw = (entry.pricing ?? null) as Record<string, unknown> | null;
    // Gateway pricing is {input, output}; OpenRouter's is {prompt, completion}.
    const input = asPrice(pricingRaw?.input) ?? asPrice(pricingRaw?.prompt);
    const output = asPrice(pricingRaw?.output) ?? asPrice(pricingRaw?.completion);
    options.push({
      id,
      name: asString(entry.name) ?? id,
      description: asString(entry.description),
      pricing: input !== undefined && output !== undefined ? { input, output } : undefined,
    });
  }
  return options;
}

/**
 * The stored credential for an agent the caller owns — internal only; the
 * key never crosses to the browser.
 */
export const credentialForAgent = internalQuery({
  args: {
    agentId: v.id("agents"),
    ownerToken: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ apiKey: v.string(), provider: providerValidator }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || !ownsAgent(agent, args.ownerToken?.trim() || undefined)) {
      return null;
    }
    const secret = await ctx.db
      .query("agentSecrets")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .unique();
    if (secret?.openRouterApiKey) {
      return { apiKey: secret.openRouterApiKey, provider: "openrouter" as const };
    }
    if (secret?.aiGatewayApiKey) {
      return { apiKey: secret.aiGatewayApiKey, provider: "gateway" as const };
    }
    return null;
  },
});

export const list = action({
  args: {
    dashboardSecret: v.optional(v.string()),
    ownerToken: v.optional(v.string()),
    /** A key typed in the form (validated there) — used when present. */
    apiKey: v.optional(v.string()),
    provider: v.optional(providerValidator),
    /** Edit mode: fall back to this agent's stored credential. */
    agentId: v.optional(v.id("agents")),
  },
  returns: v.object({ models: v.array(modelOption) }),
  handler: async (ctx, args): Promise<{ models: ModelOption[] }> => {
    requireDashboardSecret(args.dashboardSecret);

    let apiKey = args.apiKey?.trim() || undefined;
    let provider = args.provider ?? "gateway";
    if (!apiKey && args.agentId) {
      const stored = await ctx.runQuery(internal.models.credentialForAgent, {
        agentId: args.agentId,
        ownerToken: args.ownerToken,
      });
      if (stored) {
        apiKey = stored.apiKey;
        provider = stored.provider;
      }
    }
    if (!apiKey) return { models: [] };

    const url =
      provider === "openrouter"
        ? `${OPENROUTER_ORIGIN}/api/v1/models`
        : `${GATEWAY_ORIGIN}/v1/models`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) return { models: [] };
      return { models: parseCatalog(await response.json()) };
    } catch {
      return { models: [] };
    }
  },
});
