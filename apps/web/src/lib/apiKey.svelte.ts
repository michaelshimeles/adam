/**
 * The visitor's model API key (BYOK) — either a Vercel AI Gateway key or an
 * OpenRouter key. The deployment is public, so chat turns run on the
 * visitor's own credits: the dashboard asks for a key up front, keeps it in
 * localStorage, and chat:send carries it (with its provider) on every call.
 */

export type ModelProvider = "gateway" | "openrouter";

const STORAGE_KEY = "eve-convex-model-key";
/** Pre-OpenRouter storage: a bare gateway key string. */
const LEGACY_STORAGE_KEY = "eve-convex-gateway-key";

interface StoredKey {
  provider: ModelProvider;
  key: string;
}

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  gateway: "Vercel AI Gateway",
  openrouter: "OpenRouter",
};

function load(): StoredKey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredKey>;
      if (
        typeof parsed.key === "string" &&
        parsed.key.trim().length > 0 &&
        (parsed.provider === "gateway" || parsed.provider === "openrouter")
      ) {
        return { provider: parsed.provider, key: parsed.key };
      }
    }
    // Migrate a key saved before the provider choice existed.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && legacy.trim().length > 0) {
      const migrated: StoredKey = { provider: "gateway", key: legacy };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

let stored = $state<StoredKey | null>(load());

export const modelKey = {
  get value(): string | null {
    return stored?.key ?? null;
  },
  get provider(): ModelProvider | null {
    return stored?.provider ?? null;
  },
  get providerLabel(): string | null {
    return stored ? PROVIDER_LABELS[stored.provider] : null;
  },
  /** Last characters for the "key saved" chip — never the full key. */
  get hint(): string | null {
    return stored ? stored.key.slice(-4) : null;
  },
  set(provider: ModelProvider, next: string): void {
    const trimmed = next.trim();
    if (!trimmed) return;
    stored = { provider, key: trimmed };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // storage unavailable (private mode etc.) — key lives for this visit only
    }
  },
  clear(): void {
    stored = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clean up if storage was unavailable
    }
  },
};
