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
};

export const CONVEX_URL: string =
  (import.meta.env.VITE_CONVEX_URL as string | undefined) ??
  "http://127.0.0.1:3210";

/**
 * Empty string targets same-origin `/eve/v1/*` routes — in dev the Vite proxy
 * forwards those to the local eve server. Set VITE_EVE_HOST to an absolute
 * origin (CORS required) when the dashboard is hosted elsewhere, e.g. on
 * Convex static hosting.
 */
export const EVE_HOST: string =
  (import.meta.env.VITE_EVE_HOST as string | undefined) ?? "";
