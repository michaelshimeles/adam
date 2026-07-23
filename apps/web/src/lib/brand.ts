/**
 * Deployment branding. The agent-builder pipeline builds this app once per
 * deployed agent with VITE_AGENT_* set, turning the repo dashboard into that
 * agent's own app (agent name in the chrome, webhook card shown when the
 * channel is on). Unset — the repo's own dev/demo build — falls back to the
 * adam brand. Marketing lives in platform/builder-web (`/` + `/builder`).
 */

const env = import.meta.env as Record<string, string | undefined>;

/** Set → this build is a deployed agent's dashboard, not the adam demo. */
export const AGENT_NAME: string | null = env.VITE_AGENT_NAME?.trim() || null;

export const AGENT_MODEL: string | null = env.VITE_AGENT_MODEL?.trim() || null;

export const WEBHOOK_ENABLED: boolean = env.VITE_WEBHOOK_ENABLED === "1";

export const BRAND_NAME: string = AGENT_NAME ?? "adam";

export const IS_AGENT_APP: boolean = AGENT_NAME !== null;
