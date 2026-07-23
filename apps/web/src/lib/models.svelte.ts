import type { ModelProvider } from "./api";
import { AGENT_MODEL } from "./brand";

/**
 * The web chat's selected model. Rides along on every send as one-turn
 * clientContext ({ eveWebModel }) that the agent's dynamic model resolver
 * reads; sessions the deployment starts itself (schedules, webhooks) keep
 * the configured default.
 *
 * Selections are remembered per provider: gateway and OpenRouter catalogs
 * have different ids, so a single shared choice would leak one provider's
 * model id into turns paid for by the other's key after a key swap.
 * Favorites are cosmetic and stay global.
 */

const MODEL_KEY_PREFIX = "eve-convex-web-model";
const FAVORITES_KEY = "eve-convex-model-favorites";

export const DEFAULT_MODEL_ID: string = AGENT_MODEL ?? "anthropic/claude-sonnet-5";

function storageKey(provider: ModelProvider | null): string {
  return provider ? `${MODEL_KEY_PREFIX}:${provider}` : MODEL_KEY_PREFIX;
}

function loadModel(provider: ModelProvider | null): string {
  try {
    return (
      localStorage.getItem(storageKey(provider)) ??
      // Pre-per-provider storage; adopt it as the starting choice.
      localStorage.getItem(MODEL_KEY_PREFIX) ??
      DEFAULT_MODEL_ID
    );
  } catch {
    return DEFAULT_MODEL_ID;
  }
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

let activeProvider = $state<ModelProvider | null>(null);
let selected = $state<string>(loadModel(null));
let favorites = $state<string[]>(loadFavorites());

export const webModel = {
  get selected(): string {
    return selected;
  },
  get favorites(): string[] {
    return favorites;
  },
  /** Point the selection at `provider`'s remembered choice (or the default). */
  activateProvider(provider: ModelProvider): void {
    if (provider === activeProvider) return;
    activeProvider = provider;
    selected = loadModel(provider);
  },
  select(id: string): void {
    selected = id;
    try {
      localStorage.setItem(storageKey(activeProvider), id);
    } catch {
      // storage unavailable — the selection still applies for this visit
    }
  },
  toggleFavorite(id: string): void {
    favorites = favorites.includes(id)
      ? favorites.filter((entry) => entry !== id)
      : [...favorites, id];
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // storage unavailable — favorites still apply for this visit
    }
  },
};
