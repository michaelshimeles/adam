/**
 * The visitor's Vercel AI Gateway key (BYOK). The deployment is public, so
 * chat turns run on the visitor's own gateway credits: the dashboard asks
 * for a key up front, keeps it in localStorage, and chat:send carries it on
 * every call.
 */

const STORAGE_KEY = "eve-convex-gateway-key";

function load(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

let key = $state<string | null>(load());

export const gatewayKey = {
  get value(): string | null {
    return key;
  },
  /** Last characters for the "key saved" chip — never the full key. */
  get hint(): string | null {
    return key ? key.slice(-4) : null;
  },
  set(next: string): void {
    const trimmed = next.trim();
    if (!trimmed) return;
    key = trimmed;
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // storage unavailable (private mode etc.) — key lives for this visit only
    }
  },
  clear(): void {
    key = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clean up if storage was unavailable
    }
  },
};
