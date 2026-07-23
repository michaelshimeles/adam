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

/** True when this deployment can bill model calls without a visitor key. */
export function hasOwnerCredential(): boolean {
  return (
    (process.env.AI_GATEWAY_API_KEY ?? "").trim() !== "" ||
    (process.env.VERCEL_OIDC_TOKEN ?? "").trim() !== "" ||
    (process.env.OPENROUTER_API_KEY ?? "").trim() !== ""
  );
}

/** Owner baseline: gateway credentials win; OpenRouter is the fallback. */
export function ownerOpenRouterKey(): string | undefined {
  const hasGatewayCredential =
    (process.env.AI_GATEWAY_API_KEY ?? "").trim() !== "" ||
    (process.env.VERCEL_OIDC_TOKEN ?? "").trim() !== "";
  if (hasGatewayCredential) return undefined;
  const openRouterKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
  return openRouterKey === "" ? undefined : openRouterKey;
}

/** Which provider the deployment's own env key uses (for catalog fetches). */
export function ownerProvider(): ModelProvider | null {
  if (!hasOwnerCredential()) return null;
  return ownerOpenRouterKey() !== undefined ? "openrouter" : "gateway";
}

/** The deployment env key value for catalog fetches (never expose to clients). */
export function ownerApiKey(): string | null {
  const openRouter = ownerOpenRouterKey();
  if (openRouter !== undefined) return openRouter;
  const gateway = (process.env.AI_GATEWAY_API_KEY ?? "").trim();
  return gateway === "" ? null : gateway;
}
