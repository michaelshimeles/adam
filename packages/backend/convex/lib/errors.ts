import { ConvexError } from "convex/values";

/**
 * Structured error codes crossing the Convex boundary. The world-convex
 * client maps these back onto the typed @workflow/errors classes
 * (EntityConflictError, RunExpiredError, TooEarlyError, ...).
 */
export type WorldErrorCode =
  | "ENTITY_CONFLICT"
  | "RUN_EXPIRED"
  | "TOO_EARLY"
  | "RUN_NOT_FOUND"
  | "HOOK_NOT_FOUND"
  | "RUN_NOT_SUPPORTED"
  | "ATTRIBUTE_VALIDATION"
  | "WORLD_ERROR";

export type WorldErrorPayload = {
  worldError: true;
  code: WorldErrorCode;
  message: string;
  /** TooEarlyError: seconds until the step may start */
  retryAfter?: number;
  /** RunNotSupportedError context */
  runSpecVersion?: number;
  worldSpecVersion?: number;
};

export function worldError(
  code: WorldErrorCode,
  message: string,
  extra?: Partial<Pick<WorldErrorPayload, "retryAfter" | "runSpecVersion" | "worldSpecVersion">>,
): never {
  const payload: WorldErrorPayload = {
    worldError: true,
    code,
    message,
    ...extra,
  };
  throw new ConvexError(payload);
}
