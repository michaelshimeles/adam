/**
 * Serialized access to the process-global AI Gateway credential.
 *
 * The eve runtime resolves model credentials from
 * process.env.AI_GATEWAY_API_KEY at request time, so BYOK works by mutating
 * that env var around each delivery. But "use node" actions share a warm
 * Node process: chat:send's key cleanup used to race a concurrent
 * runner tick's key injection — deleting the visitor's key mid-delivery,
 * at which point the AI SDK gateway silently fell back to the deployment's
 * own credential (VERCEL_OIDC_TOKEN) and billed the owner instead.
 *
 * This mutex makes every set-key → run → restore section atomic within the
 * process: exactly one gateway key (or the owner's credential, for
 * `key === OWNER`) is ever "live", and cleanups can't clobber someone
 * else's in-flight delivery. Convex may also run actions in separate
 * processes; that case never shared env state to begin with.
 */

/**
 * Run `fn` on the deployment's own credentials: the env is left at its
 * baseline (deployment AI_GATEWAY_API_KEY if configured, else OIDC fallback).
 */
export const OWNER = Symbol("owner-credentials");

let chain: Promise<unknown> = Promise.resolve();

export function withGatewayKey<T>(
  key: string | typeof OWNER,
  fn: () => Promise<T>,
): Promise<T> {
  const run = chain.then(async () => {
    // Serialized, so `previous` is the deployment baseline, not another
    // caller's in-flight key.
    const previous = process.env.AI_GATEWAY_API_KEY;
    if (key !== OWNER) process.env.AI_GATEWAY_API_KEY = key;
    try {
      return await fn();
    } finally {
      if (previous === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = previous;
    }
  });
  // Keep the chain alive across failures without swallowing them for callers.
  chain = run.catch(() => {});
  return run;
}
