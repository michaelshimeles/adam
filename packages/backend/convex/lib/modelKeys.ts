import { v } from "convex/values";

/**
 * BYOK credential providers. Visitors can chat on either:
 *   - "gateway"    — a Vercel AI Gateway key (vck_…)
 *   - "openrouter" — an OpenRouter key (sk-or-…)
 *
 * The provider travels with the key everywhere it goes (chat:send args,
 * sessionKeys rows, runner buckets) so the runner knows whether to inject
 * the key as AI_GATEWAY_API_KEY or to swap the AI SDK default provider to
 * OpenRouter for that session's deliveries.
 */

export type ModelProvider = "gateway" | "openrouter";

export const modelProviderValidator = v.union(
  v.literal("gateway"),
  v.literal("openrouter"),
);

/** Rows/args written before OpenRouter support existed carry no provider. */
export function normalizeProvider(
  provider: ModelProvider | undefined,
): ModelProvider {
  return provider ?? "gateway";
}

/** A visitor-supplied model credential: which provider, and the key itself. */
export interface ModelKeyCredential {
  provider: ModelProvider;
  apiKey: string;
}
