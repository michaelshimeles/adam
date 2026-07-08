import type {
  CreateEventParams,
  CreateEventRequest,
  Event,
  EventResult,
  GetEventParams,
  GetHookParams,
  GetStepParams,
  GetWorkflowRunParams,
  Hook,
  ListEventsByCorrelationIdParams,
  ListEventsParams,
  ListHooksParams,
  ListWorkflowRunsParams,
  ListWorkflowRunStepsParams,
  PaginatedResponse,
  RunCreatedEventRequest,
  Step,
  Storage,
  WorkflowRun,
} from "@workflow/world";
import { SPEC_VERSION_CURRENT } from "@workflow/world";
import { ConvexWorldClient, fns } from "./client.js";
import { parseTypedJson, stringifyTypedJson } from "./typedjson.js";

/**
 * Storage implementation backed by the Convex world functions.
 *
 * All payload-bearing fields travel as TypedJSON strings; timestamps travel
 * as epoch milliseconds and are decoded to Dates here. The Convex mutation
 * `world/events:create` runs the entire event-materialization transactionally,
 * mirroring world-postgres's storage engine semantics.
 */

// ---------------------------------------------------------------------------
// Wire → SDK decoding
// ---------------------------------------------------------------------------

type EncRun = {
  runId: string;
  status: string;
  deploymentId: string;
  workflowName: string;
  specVersion?: number;
  input?: string;
  output?: string;
  error?: string;
  errorCode?: string;
  executionContext?: string;
  attributesJson: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  expiredAt?: number;
};

type EncStep = {
  runId: string;
  stepId: string;
  stepName: string;
  status: string;
  input?: string;
  output?: string;
  error?: string;
  attempt: number;
  startedAt?: number;
  completedAt?: number;
  retryAfter?: number;
  specVersion?: number;
  createdAt: number;
  updatedAt: number;
};

type EncHook = {
  runId: string;
  hookId: string;
  token: string;
  ownerId: string;
  projectId: string;
  environment: string;
  metadata?: string;
  specVersion?: number;
  isWebhook?: boolean;
  isSystem?: boolean;
  createdAt: number;
};

type EncWait = {
  waitId: string;
  runId: string;
  status: string;
  resumeAt?: number;
  completedAt?: number;
  specVersion?: number;
  createdAt: number;
  updatedAt: number;
};

type EncEvent = {
  eventId: string;
  runId: string;
  eventType: string;
  correlationId?: string;
  eventDataJson?: string;
  specVersion?: number;
  createdAt: number;
};

type EncEventResult = {
  event?: EncEvent;
  run?: EncRun;
  step?: EncStep;
  hook?: EncHook;
  wait?: EncWait;
  events?: EncEvent[];
  cursor?: string | null;
  hasMore?: boolean;
  stepCreated?: boolean;
};

type EncPage<T> = { data: T[]; cursor: string | null; hasMore: boolean };

const toDate = (ms: number | undefined): Date | undefined =>
  ms === undefined ? undefined : new Date(ms);

function decodeRun(enc: EncRun, resolveData: "none" | "all"): WorkflowRun {
  const withData = resolveData !== "none";
  return {
    runId: enc.runId,
    status: enc.status,
    deploymentId: enc.deploymentId,
    workflowName: enc.workflowName,
    specVersion: enc.specVersion,
    input: withData ? parseTypedJson(enc.input) : undefined,
    output: withData ? parseTypedJson(enc.output) : undefined,
    error: parseTypedJson(enc.error),
    errorCode: enc.errorCode,
    executionContext: parseTypedJson(enc.executionContext) as
      | Record<string, unknown>
      | undefined,
    attributes: JSON.parse(enc.attributesJson) as Record<string, string>,
    createdAt: new Date(enc.createdAt),
    updatedAt: new Date(enc.updatedAt),
    startedAt: toDate(enc.startedAt),
    completedAt: toDate(enc.completedAt),
    expiredAt: toDate(enc.expiredAt),
  } as WorkflowRun;
}

function decodeStep(enc: EncStep, resolveData: "none" | "all"): Step {
  const withData = resolveData !== "none";
  return {
    runId: enc.runId,
    stepId: enc.stepId,
    stepName: enc.stepName,
    status: enc.status,
    input: withData ? parseTypedJson(enc.input) : undefined,
    output: withData ? parseTypedJson(enc.output) : undefined,
    error: parseTypedJson(enc.error),
    attempt: enc.attempt,
    startedAt: toDate(enc.startedAt),
    completedAt: toDate(enc.completedAt),
    retryAfter: toDate(enc.retryAfter),
    specVersion: enc.specVersion,
    createdAt: new Date(enc.createdAt),
    updatedAt: new Date(enc.updatedAt),
  } as Step;
}

function decodeHook(enc: EncHook): Hook {
  return {
    runId: enc.runId,
    hookId: enc.hookId,
    token: enc.token,
    ownerId: enc.ownerId,
    projectId: enc.projectId,
    environment: enc.environment,
    metadata: parseTypedJson(enc.metadata),
    specVersion: enc.specVersion,
    isWebhook: enc.isWebhook,
    isSystem: enc.isSystem,
    createdAt: new Date(enc.createdAt),
  } as Hook;
}

function decodeWait(enc: EncWait) {
  return {
    waitId: enc.waitId,
    runId: enc.runId,
    status: enc.status,
    resumeAt: toDate(enc.resumeAt),
    completedAt: toDate(enc.completedAt),
    specVersion: enc.specVersion,
    createdAt: new Date(enc.createdAt),
    updatedAt: new Date(enc.updatedAt),
  };
}

/**
 * Event-data fields the runtime consumes as Dates. TypedJSON stores Dates as
 * ISO strings; the event schemas declare these specific keys as coerced
 * dates, so convert them here for consumers that don't re-parse.
 */
const EVENT_DATE_KEYS = new Set(["resumeAt", "retryAfter"]);

function reviveEventDates(eventData: unknown): unknown {
  if (eventData === null || typeof eventData !== "object") return eventData;
  const obj = eventData as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (EVENT_DATE_KEYS.has(key) && typeof value === "string") {
      const ms = Date.parse(value);
      if (!Number.isNaN(ms)) obj[key] = new Date(ms);
    }
  }
  return obj;
}

function decodeEvent(enc: EncEvent): Event {
  return {
    eventId: enc.eventId,
    runId: enc.runId,
    eventType: enc.eventType,
    correlationId: enc.correlationId,
    eventData: reviveEventDates(parseTypedJson(enc.eventDataJson)),
    specVersion: enc.specVersion,
    createdAt: new Date(enc.createdAt),
  } as unknown as Event;
}

function decodeEventResult(enc: EncEventResult): EventResult {
  const result: EventResult = {};
  if (enc.event) result.event = decodeEvent(enc.event);
  if (enc.run) result.run = decodeRun(enc.run, "all");
  if (enc.step) result.step = decodeStep(enc.step, "all");
  if (enc.hook) result.hook = decodeHook(enc.hook);
  if (enc.wait) result.wait = decodeWait(enc.wait) as EventResult["wait"];
  if (enc.events) result.events = enc.events.map(decodeEvent);
  if (enc.cursor !== undefined) result.cursor = enc.cursor;
  if (enc.hasMore !== undefined) result.hasMore = enc.hasMore;
  if (enc.stepCreated !== undefined) result.stepCreated = enc.stepCreated;
  return result;
}

function page<TEnc, TOut>(
  enc: EncPage<TEnc>,
  decode: (item: TEnc) => TOut,
): PaginatedResponse<TOut> {
  return {
    data: enc.data.map(decode),
    cursor: enc.cursor,
    hasMore: enc.hasMore,
  };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function createStorage(client: ConvexWorldClient): Storage {
  const runs: Storage["runs"] = {
    get: (async (id: string, params?: GetWorkflowRunParams) => {
      const enc = await client.query<EncRun>(
        fns.runsGet,
        { runId: id },
        { runId: id },
      );
      return decodeRun(enc, params?.resolveData === "none" ? "none" : "all");
    }) as Storage["runs"]["get"],

    list: (async (params?: ListWorkflowRunsParams) => {
      const enc = await client.query<EncPage<EncRun>>(fns.runsList, {
        workflowName: params?.workflowName,
        status: params?.status,
        limit: params?.pagination?.limit,
        cursor: params?.pagination?.cursor,
      });
      const resolve = params?.resolveData === "none" ? "none" : "all";
      return page(enc, (r) => decodeRun(r, resolve));
    }) as Storage["runs"]["list"],

    experimentalSetAttributes: async (runId, changes, options) => {
      const result = await client.mutation<{ attributesJson: string }>(
        fns.runsSetAttributes,
        {
          runId,
          changes,
          allowReservedAttributes: options?.allowReservedAttributes,
        },
        { runId },
      );
      return {
        attributes: JSON.parse(result.attributesJson) as Record<
          string,
          string
        >,
      };
    },
  };

  const steps: Storage["steps"] = {
    get: (async (runId: string, stepId: string, params?: GetStepParams) => {
      const enc = await client.query<EncStep>(
        fns.stepsGet,
        { runId, stepId },
        { runId },
      );
      return decodeStep(enc, params?.resolveData === "none" ? "none" : "all");
    }) as Storage["steps"]["get"],

    list: (async (params: ListWorkflowRunStepsParams) => {
      const enc = await client.query<EncPage<EncStep>>(fns.stepsList, {
        runId: params.runId,
        limit: params.pagination?.limit,
        cursor: params.pagination?.cursor,
      });
      const resolve = params.resolveData === "none" ? "none" : "all";
      return page(enc, (s) => decodeStep(s, resolve));
    }) as Storage["steps"]["list"],
  };

  const events: Storage["events"] = {
    create: (async (
      runId: string | null,
      data: RunCreatedEventRequest | CreateEventRequest,
      params?: CreateEventParams,
    ) => {
      const record = data as unknown as Record<string, unknown>;
      const enc = await client.mutation<EncEventResult>(
        fns.eventsCreate,
        {
          runId,
          eventType: record.eventType,
          correlationId: record.correlationId,
          eventDataJson: stringifyTypedJson(record.eventData),
          specVersion: record.specVersion,
          worldSpecVersion: SPEC_VERSION_CURRENT,
          skipPreload: params?.skipPreload,
        },
        { runId: runId ?? undefined },
      );
      return decodeEventResult(enc);
    }) as Storage["events"]["create"],

    get: async (runId: string, eventId: string, _params?: GetEventParams) => {
      const enc = await client.query<EncEvent>(
        fns.eventsGet,
        { runId, eventId },
        { runId },
      );
      return decodeEvent(enc);
    },

    list: async (params: ListEventsParams) => {
      const enc = await client.query<EncPage<EncEvent>>(
        fns.eventsList,
        {
          runId: params.runId,
          limit: params.pagination?.limit,
          cursor: params.pagination?.cursor,
          sortOrder: params.pagination?.sortOrder,
        },
        { runId: params.runId },
      );
      return page(enc, decodeEvent);
    },

    listByCorrelationId: async (params: ListEventsByCorrelationIdParams) => {
      const enc = await client.query<EncPage<EncEvent>>(
        fns.eventsListByCorrelationId,
        {
          correlationId: params.correlationId,
          limit: params.pagination?.limit,
          cursor: params.pagination?.cursor,
          sortOrder: params.pagination?.sortOrder,
        },
      );
      return page(enc, decodeEvent);
    },
  };

  const hooks: Storage["hooks"] = {
    get: async (hookId: string, _params?: GetHookParams) => {
      const enc = await client.query<EncHook>(fns.hooksGet, { hookId });
      return decodeHook(enc);
    },

    getByToken: async (token: string, _params?: GetHookParams) => {
      const enc = await client.query<EncHook>(
        fns.hooksGetByToken,
        { token },
        { token },
      );
      return decodeHook(enc);
    },

    list: async (params: ListHooksParams) => {
      const record = params as unknown as Record<string, unknown>;
      const enc = await client.query<EncPage<EncHook>>(fns.hooksList, {
        runId: record.runId,
        limit: params.pagination?.limit,
        cursor: params.pagination?.cursor,
        sortOrder: params.pagination?.sortOrder,
      });
      return page(enc, decodeHook);
    },
  };

  return { runs, steps, events, hooks };
}
