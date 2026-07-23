import { AGENT_MODEL } from "./brand";

/**
 * The web chat's selected model. Rides along on every send as one-turn
 * clientContext ({ eveWebModel }) that the agent's dynamic model resolver
 * reads; sessions the deployment starts itself (schedules, webhooks) keep
 * the configured default. Selection and favorites persist per browser.
 */

const MODEL_KEY = "eve-convex-web-model";
const FAVORITES_KEY = "eve-convex-model-favorites";

export const DEFAULT_MODEL_ID: string = AGENT_MODEL ?? "anthropic/claude-sonnet-5";

function loadModel(): string {
  try {
    return localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL_ID;
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

let selected = $state<string>(loadModel());
let favorites = $state<string[]>(loadFavorites());

export const webModel = {
  get selected(): string {
    return selected;
  },
  get favorites(): string[] {
    return favorites;
  },
  select(id: string): void {
    selected = id;
    try {
      localStorage.setItem(MODEL_KEY, id);
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
