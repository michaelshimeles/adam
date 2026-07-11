import {
  createOpenRouter,
  type LanguageModelV4,
} from "@openrouter/ai-sdk-provider";
import type { ModelKeyCredential } from "../lib/modelKeys";

/**
 * Serialized access to the process-global model credential.
 *
 * The eve runtime resolves the model for a turn at request time through the
 * AI SDK's global default provider: `globalThis.AI_SDK_DEFAULT_PROVIDER ??
 * gateway`, where the gateway provider reads process.env.AI_GATEWAY_API_KEY.
 * BYOK therefore works by mutating that process-global state around each
 * delivery:
 *
 *   - gateway keys    → set AI_GATEWAY_API_KEY (and clear any provider
 *                       override so the default gateway provider is used)
 *   - OpenRouter keys → install an OpenRouter provider as
 *                       AI_SDK_DEFAULT_PROVIDER (model ids like
 *                       "anthropic/claude-sonnet-5" are valid OpenRouter
 *                       slugs, so the agent's model resolves unchanged)
 *
 * But "use node" actions share a warm Node process: without serialization,
 * chat:send's key injection races a concurrent runner tick's — one section
 * captures another's mid-flight visitor key as its "previous env" and
 * permanently reinstates it as the process default, after which system
 * sessions bill a random visitor (or the AI SDK silently falls back to the
 * deployment's own credential and bills the owner).
 *
 * The mutex makes every set-key → run → restore section atomic within the
 * process. Crucially, the chain lives on globalThis, NOT in module scope:
 * Convex bundles each "use node" entry point separately, so chat.ts and
 * runner/engine.ts each load their own copy of this module — module-scoped
 * chains would serialize each copy against itself but still race the other
 * copy. Convex may also run actions in separate processes; those never
 * shared env state to begin with.
 */

/**
 * Run `fn` on the deployment's own credentials: its AI_GATEWAY_API_KEY (or
 * OIDC fallback) if configured, else its OPENROUTER_API_KEY.
 */
export const OWNER = Symbol.for("eve-convex.owner-credentials");

const globalState = globalThis as {
  AI_SDK_DEFAULT_PROVIDER?: unknown;
  /** Single credential-section chain shared by every copy of this module. */
  __eveModelKeyChain?: Promise<unknown>;
};

globalState.__eveModelKeyChain ??= Promise.resolve();

/**
 * eve's harness attaches gateway-hosted provider-executed tools (currently
 * `gateway.parallel_search`, its web_search backend) to every step. The
 * OpenRouter API only executes its own `openrouter:*` server tools; it maps
 * any other provider tool id verbatim into the request, where it fails
 * schema validation. Drop foreign provider tools instead — the agent loses
 * provider-side web search on OpenRouter but keeps its `web_fetch` function
 * tool, and the turn succeeds.
 */
function stripForeignProviderTools(model: LanguageModelV4): LanguageModelV4 {
  const filter = (
    options: Parameters<LanguageModelV4["doGenerate"]>[0],
  ): Parameters<LanguageModelV4["doGenerate"]>[0] => ({
    ...options,
    tools: options.tools?.filter(
      (tool) => tool.type !== "provider" || tool.id.startsWith("openrouter."),
    ),
  });
  return {
    specificationVersion: "v4",
    provider: model.provider,
    modelId: model.modelId,
    supportedUrls: model.supportedUrls,
    doGenerate: (options) => model.doGenerate(filter(options)),
    doStream: (options) => model.doStream(filter(options)),
  };
}

/**
 * A ProviderV4-shaped wrapper around the OpenRouter AI SDK provider.
 * createOpenRouter's return value doesn't carry `specificationVersion`, and
 * without it ai@7's asProviderV4 would wrap the (already-v4) models in v2→v3
 * compatibility proxies that corrupt their stream chunks — so declare v4
 * explicitly and delegate model lookups.
 */
function openRouterDefaultProvider(apiKey: string) {
  const openrouter = createOpenRouter({
    apiKey,
    // Talking to openrouter.ai itself (not a 3rd-party OpenAI-compatible
    // host), so request the full protocol — includes streamed token usage.
    compatibility: "strict",
    appName: "adam/eve on Convex",
  });
  return {
    specificationVersion: "v4" as const,
    languageModel: (modelId: string) =>
      stripForeignProviderTools(openrouter.languageModel(modelId)),
    embeddingModel: (modelId: string) => openrouter.textEmbeddingModel(modelId),
    imageModel: (modelId: string) => openrouter.imageModel(modelId),
  };
}

/** Owner baseline: gateway credentials win; OpenRouter is the fallback. */
function ownerOpenRouterKey(): string | undefined {
  const hasGatewayCredential =
    (process.env.AI_GATEWAY_API_KEY ?? "").trim() !== "" ||
    (process.env.VERCEL_OIDC_TOKEN ?? "").trim() !== "";
  if (hasGatewayCredential) return undefined;
  const openRouterKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
  return openRouterKey === "" ? undefined : openRouterKey;
}

export function withModelKey<T>(
  key: ModelKeyCredential | typeof OWNER,
  fn: () => Promise<T>,
): Promise<T> {
  const run = globalState.__eveModelKeyChain!.then(async () => {
    // Serialized process-wide, so `previous*` is the deployment baseline,
    // not another caller's in-flight credential.
    const previousEnv = process.env.AI_GATEWAY_API_KEY;
    const previousProvider = globalState.AI_SDK_DEFAULT_PROVIDER;

    const openRouterKey =
      key === OWNER
        ? ownerOpenRouterKey()
        : key.provider === "openrouter"
          ? key.apiKey
          : undefined;

    if (openRouterKey !== undefined) {
      globalState.AI_SDK_DEFAULT_PROVIDER =
        openRouterDefaultProvider(openRouterKey);
    } else {
      // Route through the default gateway provider — a leftover override
      // must never shadow it.
      delete globalState.AI_SDK_DEFAULT_PROVIDER;
      if (key !== OWNER) process.env.AI_GATEWAY_API_KEY = key.apiKey;
    }

    try {
      return await fn();
    } finally {
      if (previousEnv === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = previousEnv;
      if (previousProvider === undefined) {
        delete globalState.AI_SDK_DEFAULT_PROVIDER;
      } else {
        globalState.AI_SDK_DEFAULT_PROVIDER = previousProvider;
      }
    }
  });
  // Keep the chain alive across failures without swallowing them for callers.
  globalState.__eveModelKeyChain = run.catch(() => {});
  return run;
}
