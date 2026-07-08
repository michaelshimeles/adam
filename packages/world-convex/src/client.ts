import { ConvexHttpClient, ConvexClient } from "convex/browser";
import { makeFunctionReference, type FunctionReference } from "convex/server";
import { ConvexError } from "convex/values";
import {
  EntityConflictError,
  HookNotFoundError,
  RunExpiredError,
  RunNotSupportedError,
  TooEarlyError,
  WorkflowRunNotFoundError,
  WorkflowWorldError,
} from "@workflow/errors";
import type { ConvexWorldConfig } from "./config.js";

/**
 * Thin wrapper around the Convex clients:
 * - ConvexHttpClient for one-shot queries/mutations (storage API calls)
 * - ConvexClient (WebSocket) for reactive subscriptions (queue wake signal,
 *   live stream tailing)
 *
 * Also maps structured ConvexError payloads thrown by the backend's world
 * functions onto the typed @workflow/errors classes the runtime expects.
 */

const queryRef = (path: string) => makeFunctionReference<"query">(path);
const mutationRef = (path: string) => makeFunctionReference<"mutation">(path);

/** Convex function references for the world API (untyped; names are stable). */
export const fns = {
  eventsCreate: mutationRef("world/events:create"),
  eventsGet: queryRef("world/events:get"),
  eventsList: queryRef("world/events:list"),
  eventsListByCorrelationId: queryRef("world/events:listByCorrelationId"),
  runsGet: queryRef("world/runs:get"),
  runsList: queryRef("world/runs:list"),
  runsSetAttributes: mutationRef("world/runs:setAttributes"),
  stepsGet: queryRef("world/steps:get"),
  stepsList: queryRef("world/steps:list"),
  hooksGet: queryRef("world/hooks:get"),
  hooksGetByToken: queryRef("world/hooks:getByToken"),
  hooksList: queryRef("world/hooks:list"),
  queueEnqueue: mutationRef("world/queue:enqueue"),
  queueWake: queryRef("world/queue:wake"),
  queueClaim: mutationRef("world/queue:claim"),
  queueHeartbeat: mutationRef("world/queue:heartbeat"),
  queueComplete: mutationRef("world/queue:complete"),
  queueReschedule: mutationRef("world/queue:reschedule"),
  queueRelease: mutationRef("world/queue:release"),
  queueFail: mutationRef("world/queue:fail"),
  streamsWriteChunks: mutationRef("world/streams:writeChunks"),
  streamsMeta: queryRef("world/streams:meta"),
  streamsGetChunksPage: queryRef("world/streams:getChunksPage"),
  streamsList: queryRef("world/streams:list"),
} satisfies Record<string, FunctionReference<any, any>>;

interface WorldErrorPayload {
  worldError: true;
  code: string;
  message: string;
  retryAfter?: number;
  runSpecVersion?: number;
  worldSpecVersion?: number;
}

function isWorldErrorPayload(data: unknown): data is WorldErrorPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Record<string, unknown>).worldError === true &&
    typeof (data as Record<string, unknown>).code === "string"
  );
}

export interface ErrorContext {
  runId?: string;
  token?: string;
}

/** Map a ConvexError from the world functions to a typed workflow error. */
export function mapWorldError(err: unknown, ctx: ErrorContext = {}): never {
  if (err instanceof ConvexError && isWorldErrorPayload(err.data)) {
    const payload = err.data;
    switch (payload.code) {
      case "ENTITY_CONFLICT":
        throw new EntityConflictError(payload.message);
      case "RUN_EXPIRED":
        throw new RunExpiredError(payload.message);
      case "TOO_EARLY":
        throw new TooEarlyError(payload.message, {
          retryAfter: payload.retryAfter,
        });
      case "RUN_NOT_FOUND":
        throw new WorkflowRunNotFoundError(ctx.runId ?? payload.message);
      case "HOOK_NOT_FOUND":
        throw new HookNotFoundError(ctx.token ?? "");
      case "RUN_NOT_SUPPORTED":
        throw new RunNotSupportedError(
          payload.runSpecVersion ?? 0,
          payload.worldSpecVersion ?? 0,
        );
      default:
        throw new WorkflowWorldError(payload.message);
    }
  }
  throw err;
}

export class ConvexWorldClient {
  readonly http: ConvexHttpClient;
  private ws: ConvexClient | null = null;
  private readonly config: ConvexWorldConfig;

  constructor(config: ConvexWorldConfig) {
    this.config = config;
    this.http = new ConvexHttpClient(config.convexUrl);
  }

  /** Lazily-created WebSocket client for subscriptions. */
  get subscriber(): ConvexClient {
    if (!this.ws) {
      this.ws = new ConvexClient(this.config.convexUrl);
    }
    return this.ws;
  }

  get secret(): string {
    return this.config.serviceSecret;
  }

  async query<T>(
    fn: FunctionReference<any, any>,
    args: Record<string, unknown>,
    ctx?: ErrorContext,
  ): Promise<T> {
    try {
      return (await this.http.query(fn as any, {
        secret: this.secret,
        ...args,
      })) as T;
    } catch (err) {
      mapWorldError(err, ctx);
    }
  }

  async mutation<T>(
    fn: FunctionReference<any, any>,
    args: Record<string, unknown>,
    ctx?: ErrorContext,
  ): Promise<T> {
    try {
      return (await this.http.mutation(fn as any, {
        secret: this.secret,
        ...args,
      })) as T;
    } catch (err) {
      mapWorldError(err, ctx);
    }
  }

  async close(): Promise<void> {
    if (this.ws) {
      await this.ws.close();
      this.ws = null;
    }
  }
}
