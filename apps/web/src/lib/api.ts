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

/**
 * One reactive page of decoded session stream events (ui:sessionEvents).
 * Each event is a JSON string — tool payloads carry arbitrary JSON whose
 * field names (e.g. "$schema") Convex values can't hold structured.
 */
export interface SessionEventsPage {
  events: string[];
  nextSeq: number;
  done: boolean;
}

/** Parse a sessionEvents page into event objects (drops malformed lines). */
export function parseSessionEvents(page: SessionEventsPage): unknown[] {
  const parsed: unknown[] = [];
  for (const raw of page.events) {
    try {
      parsed.push(JSON.parse(raw));
    } catch {
      // Never expected (the server validates each line) — skip defensively.
    }
  }
  return parsed;
}

export type ModelProvider = "gateway" | "openrouter";

export const chatApi = {
  send: makeFunctionReference<
    "action",
    {
      /**
       * Optional visitor BYOK key. Omit when the deployment has its own
       * AI_GATEWAY_API_KEY (builder-configured agents).
       */
      apiKey?: string;
      /** Which service issued apiKey; omitted means "gateway". */
      provider?: ModelProvider;
      sessionId?: string;
      message?: string;
      inputResponses?: unknown[];
      continuationToken?: string;
      /** One-turn context (e.g. { eveWebModel }) for the model resolver. */
      clientContext?: Record<string, unknown>;
    },
    ChatSendResult
  >("chat:send"),
  sessionEvents: makeFunctionReference<
    "query",
    { sessionId: string; startSeq?: number },
    SessionEventsPage | null
  >("ui:sessionEvents"),
};

/** One entry of the model catalog (models:list). */
export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  /** Per-token USD prices, as strings. */
  pricing?: { input: string; output: string };
}

export const modelsApi = {
  /**
   * Provider model catalog. Pass a visitor BYOK key, or omit to use the
   * deployment's own credential when one is configured.
   */
  list: makeFunctionReference<
    "action",
    { apiKey?: string; provider?: ModelProvider },
    { models: ModelOption[] }
  >("models:list"),
};

// --- Manage page (read-only lists; writes go through the agent in chat) ---

export interface Reminder {
  id: string;
  prompt: string;
  /** 5-field cron for recurring reminders; null for one-offs. */
  cron: string | null;
  timezone: string;
  nextFireAt: number;
  chatId: string | null;
  status: string;
  lastFiredAt: number | null;
  createdAt: number;
}

export interface Trigger {
  hookId: string;
  name: string;
  fireCount: number;
  lastFiredAt: number | null;
  createdAt: number;
}

export interface Memory {
  id: string;
  content: string;
  permanent: boolean;
  updatedAt: number;
}

export interface Skill {
  name: string;
  description: string;
  markdown: string;
  updatedAt: number;
}

export const manageApi = {
  reminders: makeFunctionReference<"query", Record<string, never>, Reminder[]>(
    "reminders:list",
  ),
  triggers: makeFunctionReference<"query", Record<string, never>, Trigger[]>(
    "triggers:list",
  ),
  memories: makeFunctionReference<"query", { limit?: number }, Memory[]>(
    "memories:list",
  ),
  skills: makeFunctionReference<"query", Record<string, never>, Skill[]>(
    "agentSkills:list",
  ),
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
  /** True when the deployment can chat without a visitor-supplied key. */
  hasDeploymentCredential: makeFunctionReference<
    "query",
    Record<string, never>,
    boolean
  >("keys:hasDeploymentCredential"),
};

export const CONVEX_URL: string =
  (import.meta.env.VITE_CONVEX_URL as string | undefined) ??
  "http://127.0.0.1:3210";
