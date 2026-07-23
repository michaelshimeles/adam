import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  modelProviderValidator,
  normalizeProvider,
  ownerApiKey,
  ownerProvider,
} from "./lib/modelKeys";

/**
 * Model catalog for the web chat's model picker.
 *
 * Fetched server-side with either the visitor's BYOK key or the deployment's
 * own credential (neither provider's catalog endpoint allows browser CORS).
 * Gateway keys read the AI Gateway's config catalog — the same source the
 * `ai` package's `gateway.getAvailableModels()` uses — and OpenRouter keys
 * read OpenRouter's public model list, so the ids offered always match the
 * provider that will execute the turn.
 */

const GATEWAY_ORIGIN = "https://ai-gateway.vercel.sh";
const OPENROUTER_ORIGIN = "https://openrouter.ai";

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
    // The gateway catalog tags non-chat entries (embeddings, images).
    const modelType = asString(entry.modelType);
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

export const list = action({
  args: {
    /**
     * Optional visitor BYOK key. When omitted, the deployment's own
     * AI_GATEWAY_API_KEY / OPENROUTER_API_KEY is used (if present).
     */
    apiKey: v.optional(v.string()),
    provider: v.optional(modelProviderValidator),
  },
  returns: v.object({ models: v.array(modelOption) }),
  handler: async (_ctx, args): Promise<{ models: ModelOption[] }> => {
    const visitorKey = args.apiKey?.trim() ?? "";
    const apiKey = visitorKey !== "" ? visitorKey : ownerApiKey();
    if (!apiKey) return { models: [] };
    const provider =
      visitorKey !== ""
        ? normalizeProvider(args.provider)
        : (ownerProvider() ?? "gateway");
    const url =
      provider === "openrouter"
        ? `${OPENROUTER_ORIGIN}/api/v1/models`
        : `${GATEWAY_ORIGIN}/v1/config`;
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
