/**
 * world-convex configuration, resolved from the environment:
 *
 * - CONVEX_URL / VITE_CONVEX_URL / NEXT_PUBLIC_CONVEX_URL — the Convex
 *   deployment's client URL (https://<name>.convex.cloud)
 * - WORLD_SERVICE_SECRET — shared secret; must equal the value set on the
 *   Convex deployment (`npx convex env set WORLD_SERVICE_SECRET ...`)
 * - WORKFLOW_CONVEX_TARGET_BASE_URL / WORKFLOW_LOCAL_BASE_URL / PORT — where
 *   the eve host's workflow endpoints live (queue delivery target)
 */
export interface ConvexWorldConfig {
  convexUrl: string;
  serviceSecret: string;
  /** Base origin of the eve host, e.g. http://localhost:3000 */
  targetBaseUrl: string;
  /** Max parallel queue deliveries */
  queueConcurrency: number;
  /** Lease duration for claimed jobs (ms) */
  leaseMs: number;
  /** Buffered stream write flush interval (ms) */
  streamFlushIntervalMs: number;
}

export function resolveConfig(
  overrides: Partial<ConvexWorldConfig> = {},
): ConvexWorldConfig {
  const convexUrl =
    overrides.convexUrl ??
    process.env.CONVEX_URL ??
    process.env.VITE_CONVEX_URL ??
    process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "world-convex: CONVEX_URL is not set. Point it at your Convex deployment (https://<name>.convex.cloud).",
    );
  }
  const serviceSecret =
    overrides.serviceSecret ?? process.env.WORLD_SERVICE_SECRET;
  if (!serviceSecret) {
    throw new Error(
      "world-convex: WORLD_SERVICE_SECRET is not set. Set the same value here and on the Convex deployment (npx convex env set WORLD_SERVICE_SECRET <value>).",
    );
  }
  const targetBaseUrl =
    overrides.targetBaseUrl ??
    process.env.WORKFLOW_CONVEX_TARGET_BASE_URL ??
    process.env.WORKFLOW_LOCAL_BASE_URL ??
    `http://localhost:${process.env.PORT ?? "3000"}`;

  return {
    convexUrl,
    serviceSecret,
    targetBaseUrl,
    queueConcurrency: overrides.queueConcurrency ?? 16,
    leaseMs: overrides.leaseMs ?? 5 * 60 * 1000,
    streamFlushIntervalMs: overrides.streamFlushIntervalMs ?? 25,
  };
}
