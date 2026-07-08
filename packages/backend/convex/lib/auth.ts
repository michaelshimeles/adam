import { worldError } from "./errors";

/**
 * World functions are called by the trusted eve host process (world-convex
 * client) with a shared service secret, not by browsers. This is the
 * machine-to-machine equivalent of user auth for this deployment.
 *
 * Set WORLD_SERVICE_SECRET on the Convex deployment (npx convex env set)
 * and give the same value to the eve host via its environment.
 */
export function requireServiceSecret(secret: string): void {
  const expected = process.env.WORLD_SERVICE_SECRET;
  if (!expected) {
    worldError(
      "WORLD_ERROR",
      "WORLD_SERVICE_SECRET is not configured on the Convex deployment",
    );
  }
  if (secret !== expected) {
    worldError("WORLD_ERROR", "Invalid world service secret");
  }
}
