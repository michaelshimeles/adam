import { makeFunctionReference } from "convex/server";

/**
 * Hand-typed references to the backend's public UI functions
 * (packages/backend/convex/{ui,notes}.ts). Kept local so the browser bundle
 * doesn't pull the backend's TypeScript program in; shapes mirror the
 * validators on the Convex side.
 */

export interface UiRun {
  runId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  workflowName: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  errorCode?: string;
}

export interface UiStep {
  stepId: string;
  stepName: string;
  status: string;
  attempt: number;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

export interface UiEvent {
  eventId: string;
  eventType: string;
  correlationId?: string;
  createdAt: number;
}

export interface UiStream {
  name: string;
  dataCount: number;
  done: boolean;
  updatedAt: number;
}

export interface UiNote {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface QueueHealth {
  pending: number;
  claimed: number;
  dead: number;
}

export interface StreamText {
  text: string;
  nextSeq: number;
  done: boolean;
}

export const api = {
  listRuns: makeFunctionReference<"query", { limit?: number }, UiRun[]>(
    "ui:listRuns",
  ),
  getRun: makeFunctionReference<"query", { runId: string }, UiRun | null>(
    "ui:getRun",
  ),
  listSteps: makeFunctionReference<"query", { runId: string }, UiStep[]>(
    "ui:listSteps",
  ),
  listEvents: makeFunctionReference<"query", { runId: string }, UiEvent[]>(
    "ui:listEvents",
  ),
  listRunStreams: makeFunctionReference<
    "query",
    { runId: string },
    UiStream[]
  >("ui:listRunStreams"),
  streamText: makeFunctionReference<
    "query",
    { runId: string; name: string; startSeq?: number },
    StreamText | null
  >("ui:streamText"),
  queueHealth: makeFunctionReference<"query", Record<string, never>, QueueHealth>(
    "ui:queueHealth",
  ),
  notesList: makeFunctionReference<"query", { limit?: number }, UiNote[]>(
    "notes:list",
  ),
  inboxList: makeFunctionReference<"query", { limit?: number }, InboxItem[]>(
    "inbox:list",
  ),
};

/** Proactive session written by a fired reminder or webhook (inbox:list). */
export interface InboxItem {
  sessionId: string;
  title: string;
  kind: string;
  createdAt: number;
}

/** chat:send action result (packages/backend/convex/chat.ts). */
export interface ChatSendResult {
  ok: boolean;
  status: number;
  sessionId?: string;
  continuationToken?: string;
  error?: string;
}

/** One reactive page of decoded session stream events (ui:sessionEvents). */
export interface SessionEventsPage {
  events: unknown[];
  nextSeq: number;
  done: boolean;
}

export type ModelProvider = "gateway" | "openrouter";

export const chatApi = {
  send: makeFunctionReference<
    "action",
    {
      /** BYOK: the visitor's own key, spent on their own turns. */
      apiKey: string;
      /** Which service issued apiKey; omitted means "gateway". */
      provider?: ModelProvider;
      sessionId?: string;
      message?: string;
      inputResponses?: unknown[];
      continuationToken?: string;
    },
    ChatSendResult
  >("chat:send"),
  sessionEvents: makeFunctionReference<
    "query",
    { sessionId: string; startSeq?: number },
    SessionEventsPage | null
  >("ui:sessionEvents"),
};

/** keys:validate action result (packages/backend/convex/keys.ts). */
export interface KeyValidationResult {
  ok: boolean;
  /** Remaining credit balance, when the provider reports one. */
  balance?: string;
  error?: string;
}

export const keysApi = {
  validate: makeFunctionReference<
    "action",
    { apiKey: string; provider?: ModelProvider },
    KeyValidationResult
  >("keys:validate"),
};

export const CONVEX_URL: string =
  (import.meta.env.VITE_CONVEX_URL as string | undefined) ??
  "http://127.0.0.1:3210";

/**
 * The agent builder UI — where agents are created and managed. Dev builds
 * link to builder-web's local dev server (port pinned in its vite.config);
 * production builds link to the hosted builder. VITE_BUILDER_URL overrides.
 */
export const BUILDER_URL: string =
  (import.meta.env.VITE_BUILDER_URL as string | undefined) ??
  (import.meta.env.DEV
    ? "http://localhost:5175"
    : "https://rosy-goldfish-504.convex.site");
