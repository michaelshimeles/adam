/**
 * Dashboard access secret. Deployed builders set BUILDER_DASHBOARD_SECRET on
 * the Convex deployment; every agents:* call must then carry the matching
 * value. We keep it in localStorage after the unlock screen (same pattern as
 * the agent dashboard's BYOK gateway key). Unset env var = open dashboard,
 * and this stays empty.
 */

const STORAGE_KEY = "eve-builder-dashboard-secret";

function load(): string | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && raw.trim().length > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}

let secret = $state<string | undefined>(load());

export const dashboardSecret = {
  get value(): string | undefined {
    return secret;
  },
  set(next: string): void {
    const trimmed = next.trim();
    if (!trimmed) return;
    secret = trimmed;
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // storage unavailable (private mode etc.) — secret lives for this visit
    }
  },
  clear(): void {
    secret = undefined;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clean up if storage was unavailable
    }
  },
};

/** Args fragment spread into every dashboard query/mutation call. */
export function authArgs(): { dashboardSecret?: string } {
  return secret ? { dashboardSecret: secret } : {};
}

/** True when a server error means "wrong or missing dashboard secret". */
export function isAuthError(err: Error | undefined): boolean {
  if (!err) return false;
  // Backend throws ConvexError("Invalid dashboard secret"): the payload is in
  // `data` (survives prod redaction) and echoed in `message`.
  const data = (err as { data?: unknown }).data;
  if (typeof data === "string" && data.includes("Invalid dashboard secret")) {
    return true;
  }
  return err.message.includes("Invalid dashboard secret");
}
