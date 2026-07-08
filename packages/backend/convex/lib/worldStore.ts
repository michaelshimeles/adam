import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  applyAttributeChanges,
  validateAttributeChanges,
  type AttributeChange,
} from "./attrs";
import { worldError } from "./errors";
import { monotonicUlidFactory, validateUlidTimestamp } from "./ids";
import { isoToMs, parseTypedJson, stringifySubValue } from "./typedjson";

/**
 * Convex port of world-postgres's event-sourced storage engine
 * (packages/world-postgres/src/storage.ts). The whole of createEvent runs
 * inside one Convex mutation, i.e. one serializable ACID transaction, so
 * the guarded-UPDATE + re-read disambiguation dances from the Postgres
 * implementation collapse into plain read → validate → write logic while
 * keeping identical externally-observable semantics and error codes.
 */

const SPEC_VERSION_LEGACY = 1;

type RunDoc = Doc<"runs">;
type StepDoc = Doc<"steps">;
type HookDoc = Doc<"hooks">;
type WaitDoc = Doc<"waits">;
type EventDoc = Doc<"events">;

// ---------------------------------------------------------------------------
// Wire encoding (Doc → EventResult wire shapes; see lib/validators.ts)
// ---------------------------------------------------------------------------

export function encodeRun(doc: RunDoc) {
  return {
    runId: doc.runId,
    status: doc.status,
    deploymentId: doc.deploymentId,
    workflowName: doc.workflowName,
    specVersion: doc.specVersion,
    input: doc.input,
    output: doc.output,
    error: doc.error,
    errorCode: doc.errorCode,
    executionContext: doc.executionContext,
    attributesJson: doc.attributesJson,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    expiredAt: doc.expiredAt,
  };
}

export function encodeStep(doc: StepDoc) {
  return {
    runId: doc.runId,
    stepId: doc.stepId,
    stepName: doc.stepName,
    status: doc.status,
    input: doc.input,
    output: doc.output,
    error: doc.error,
    attempt: doc.attempt,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    retryAfter: doc.retryAfter,
    specVersion: doc.specVersion,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function encodeHook(doc: HookDoc) {
  return {
    runId: doc.runId,
    hookId: doc.hookId,
    token: doc.token,
    ownerId: doc.ownerId,
    projectId: doc.projectId,
    environment: doc.environment,
    metadata: doc.metadata,
    specVersion: doc.specVersion,
    isWebhook: doc.isWebhook,
    isSystem: doc.isSystem,
    createdAt: doc.createdAt,
  };
}

export function encodeWait(doc: WaitDoc) {
  return {
    waitId: doc.waitId,
    runId: doc.runId,
    status: doc.status,
    resumeAt: doc.resumeAt,
    completedAt: doc.completedAt,
    specVersion: doc.specVersion,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function encodeEvent(doc: EventDoc) {
  return {
    eventId: doc.eventId,
    runId: doc.runId,
    eventType: doc.eventType,
    correlationId: doc.correlationId,
    eventDataJson: doc.eventDataJson,
    specVersion: doc.specVersion,
    createdAt: doc.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export async function getRunDoc(
  ctx: QueryCtx,
  runId: string,
): Promise<RunDoc | null> {
  return await ctx.db
    .query("runs")
    .withIndex("by_runId", (q) => q.eq("runId", runId))
    .unique();
}

export async function getStepDoc(
  ctx: QueryCtx,
  runId: string,
  stepId: string,
): Promise<StepDoc | null> {
  return await ctx.db
    .query("steps")
    .withIndex("by_run", (q) => q.eq("runId", runId).eq("stepId", stepId))
    .unique();
}

export async function getHookDocById(
  ctx: QueryCtx,
  hookId: string,
): Promise<HookDoc | null> {
  return await ctx.db
    .query("hooks")
    .withIndex("by_hookId", (q) => q.eq("hookId", hookId))
    .unique();
}

export async function getHookDocByToken(
  ctx: QueryCtx,
  token: string,
): Promise<HookDoc | null> {
  return await ctx.db
    .query("hooks")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
}

export async function getWaitDoc(
  ctx: QueryCtx,
  waitId: string,
): Promise<WaitDoc | null> {
  return await ctx.db
    .query("waits")
    .withIndex("by_waitId", (q) => q.eq("waitId", waitId))
    .unique();
}

async function getCorrelatedEvent(
  ctx: QueryCtx,
  runId: string,
  correlationId: string,
  eventType: string,
): Promise<EventDoc | null> {
  return await ctx.db
    .query("events")
    .withIndex("by_run_correlation_type", (q) =>
      q
        .eq("runId", runId)
        .eq("correlationId", correlationId)
        .eq("eventType", eventType),
    )
    .first();
}

const isTerminal = (status: string) =>
  status === "completed" || status === "failed" || status === "cancelled";

async function deleteHooksAndWaits(
  ctx: MutationCtx,
  runId: string,
): Promise<void> {
  const hooks = await ctx.db
    .query("hooks")
    .withIndex("by_run", (q) => q.eq("runId", runId))
    .collect();
  for (const hook of hooks) {
    await ctx.db.delete(hook._id);
  }
  const waits = await ctx.db
    .query("waits")
    .withIndex("by_run", (q) => q.eq("runId", runId))
    .collect();
  for (const wait of waits) {
    await ctx.db.delete(wait._id);
  }
}

function parseAttributes(json: string): Record<string, string> {
  return JSON.parse(json) as Record<string, string>;
}

// ---------------------------------------------------------------------------
// createEvent — the single write entrypoint of the event-sourced model
// ---------------------------------------------------------------------------

export interface CreateEventArgs {
  runId: string | null;
  eventType: string;
  correlationId?: string;
  /** Skip the run_started event-log preload (CreateEventParams.skipPreload) */
  skipPreload?: boolean;
  /** TypedJSON of the event's eventData */
  eventDataJson?: string;
  specVersion?: number;
  /** SPEC_VERSION_CURRENT of the calling world client */
  worldSpecVersion: number;
}

export interface EventResultEnc {
  event?: ReturnType<typeof encodeEvent>;
  run?: ReturnType<typeof encodeRun>;
  step?: ReturnType<typeof encodeStep>;
  hook?: ReturnType<typeof encodeHook>;
  wait?: ReturnType<typeof encodeWait>;
  events?: ReturnType<typeof encodeEvent>[];
  cursor?: string | null;
  hasMore?: boolean;
  stepCreated?: boolean;
}

export async function createEventImpl(
  ctx: MutationCtx,
  args: CreateEventArgs,
): Promise<EventResultEnc> {
  const now = Date.now();
  const ulid = monotonicUlidFactory();
  const { eventType, correlationId } = args;
  const eventData = parseTypedJson(args.eventDataJson);

  let eventId: string | undefined;
  const getEventId = () => (eventId ??= `wevt_${ulid(now)}`);

  // -- runId resolution ------------------------------------------------------
  let effectiveRunId: string;
  if (eventType === "run_created" && (!args.runId || args.runId === "")) {
    effectiveRunId = `wrun_${ulid(now)}`;
  } else if (!args.runId) {
    worldError("WORLD_ERROR", "runId is required for non-run_created events");
  } else {
    effectiveRunId = args.runId;
  }

  if (eventType === "run_created" && args.runId && args.runId !== "") {
    const validationError = validateUlidTimestamp(effectiveRunId, "wrun_", now);
    if (validationError) {
      worldError("WORLD_ERROR", validationError);
    }
  }

  const effectiveSpecVersion = args.specVersion ?? args.worldSpecVersion;

  let run: EventResultEnc["run"];
  let step: EventResultEnc["step"];
  let hook: EventResultEnc["hook"];
  let wait: EventResultEnc["wait"];
  let stepCreatedLazily = false;

  // -- validation: current run state ----------------------------------------
  let currentRunDoc: RunDoc | null = null;
  const skipRunValidation =
    eventType === "run_created" ||
    eventType === "step_completed" ||
    eventType === "step_retrying";
  if (!skipRunValidation) {
    currentRunDoc = await getRunDoc(ctx, effectiveRunId);

    // Resilient start: run_started on a missing run carrying run-creation
    // data creates the run (+ its run_created event) first.
    if (
      eventType === "run_started" &&
      !currentRunDoc &&
      eventData &&
      eventData.deploymentId &&
      eventData.workflowName &&
      eventData.input !== undefined
    ) {
      const attrs = (eventData.attributes ?? {}) as Record<string, string>;
      validateAttributeChanges(
        Object.entries(attrs).map(([key, value]) => ({ key, value })),
        { allowReservedAttributes: eventData.allowReservedAttributes === true },
      );
      await ctx.db.insert("runs", {
        runId: effectiveRunId,
        status: "pending",
        deploymentId: eventData.deploymentId as string,
        workflowName: eventData.workflowName as string,
        specVersion: effectiveSpecVersion,
        input: stringifySubValue(eventData.input),
        executionContext: stringifySubValue(eventData.executionContext),
        attributesJson: JSON.stringify(attrs),
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("events", {
        runId: effectiveRunId,
        eventId: `wevt_${ulid(now)}`,
        eventType: "run_created",
        eventDataJson: stringifySubValue({
          deploymentId: eventData.deploymentId,
          workflowName: eventData.workflowName,
          input: eventData.input,
          executionContext: eventData.executionContext,
          attributes: eventData.attributes,
          allowReservedAttributes: eventData.allowReservedAttributes,
        }),
        specVersion: effectiveSpecVersion,
        createdAt: now,
      });
      currentRunDoc = await getRunDoc(ctx, effectiveRunId);
    }
  }

  // -- version compatibility --------------------------------------------------
  if (currentRunDoc) {
    const runSpec = currentRunDoc.specVersion;
    if (runSpec !== undefined && runSpec > args.worldSpecVersion) {
      worldError(
        "RUN_NOT_SUPPORTED",
        `Run requires spec version ${runSpec}, but this world supports ${args.worldSpecVersion}`,
        { runSpecVersion: runSpec, worldSpecVersion: args.worldSpecVersion },
      );
    }
    if (runSpec === undefined || runSpec <= SPEC_VERSION_LEGACY) {
      // Fresh Convex deployments cannot contain pre-event-sourcing runs.
      worldError(
        "WORLD_ERROR",
        `Legacy run (specVersion ${String(runSpec)}) is not supported by world-convex`,
      );
    }
  }
  if (eventType === "attr_set" && !currentRunDoc) {
    worldError("RUN_NOT_FOUND", `Workflow run "${effectiveRunId}" not found`);
  }

  // Lazy step start: step_started carrying step-creation data (stepName +
  // input) creates the step on the fly.
  const lazyStepStart =
    eventType === "step_started" &&
    !!eventData &&
    typeof eventData.stepName === "string" &&
    eventData.input !== undefined;

  // -- terminal-run validation -------------------------------------------------
  if (currentRunDoc && isTerminal(currentRunDoc.status)) {
    // Idempotent: run_cancelled on an already-cancelled run records the
    // event and returns successfully.
    if (eventType === "run_cancelled" && currentRunDoc.status === "cancelled") {
      const id = getEventId();
      await ctx.db.insert("events", {
        runId: effectiveRunId,
        eventId: id,
        correlationId,
        eventType,
        eventDataJson: args.eventDataJson,
        specVersion: effectiveSpecVersion,
        createdAt: now,
      });
      return {
        event: {
          eventId: id,
          runId: effectiveRunId,
          eventType,
          correlationId,
          eventDataJson: args.eventDataJson,
          specVersion: effectiveSpecVersion,
          createdAt: now,
        },
        run: encodeRun(currentRunDoc),
      };
    }

    if (eventType === "run_started") {
      worldError(
        "RUN_EXPIRED",
        `Workflow run "${effectiveRunId}" is already in terminal state "${currentRunDoc.status}"`,
      );
    }

    if (
      eventType === "run_completed" ||
      eventType === "run_failed" ||
      eventType === "run_cancelled"
    ) {
      worldError(
        "ENTITY_CONFLICT",
        `Cannot transition run from terminal state "${currentRunDoc.status}"`,
      );
    }

    if (
      eventType === "step_created" ||
      eventType === "hook_created" ||
      eventType === "wait_created" ||
      lazyStepStart
    ) {
      worldError(
        "ENTITY_CONFLICT",
        `Cannot create new entities on run in terminal state "${currentRunDoc.status}"`,
      );
    }

    if (eventType === "attr_set") {
      worldError(
        "ENTITY_CONFLICT",
        `Cannot set attributes on run in terminal state "${currentRunDoc.status}"`,
      );
    }
  }

  // -- step ordering/terminal validation ---------------------------------------
  let validatedStep: StepDoc | null = null;
  if (
    (eventType === "step_started" || eventType === "step_retrying") &&
    correlationId
  ) {
    validatedStep = await getStepDoc(ctx, effectiveRunId, correlationId);

    if (!validatedStep && !lazyStepStart) {
      worldError("WORLD_ERROR", `Step "${correlationId}" not found`);
    }

    // Lazy-start exactly-once gate: if the step already exists, a concurrent
    // handler won the create claim — this caller must not run the step body.
    if (lazyStepStart && validatedStep) {
      worldError("ENTITY_CONFLICT", `Step "${correlationId}" already created`);
    }

    if (validatedStep) {
      if (isTerminal(validatedStep.status)) {
        worldError(
          "ENTITY_CONFLICT",
          `Cannot modify step in terminal state "${validatedStep.status}"`,
        );
      }
      if (
        currentRunDoc &&
        isTerminal(currentRunDoc.status) &&
        validatedStep.status !== "running"
      ) {
        worldError(
          "RUN_EXPIRED",
          `Cannot modify non-running step on run in terminal state "${currentRunDoc.status}"`,
        );
      }
    }
  }

  // -- hook ordering validation -------------------------------------------------
  if (
    (eventType === "hook_disposed" || eventType === "hook_received") &&
    correlationId
  ) {
    const existingHook = await getHookDocById(ctx, correlationId);
    if (!existingHook) {
      worldError("HOOK_NOT_FOUND", `Hook not found: ${correlationId}`);
    }
  }

  // ===========================================================================
  // Materialization
  // ===========================================================================

  if (eventType === "run_created") {
    const attrs = (eventData?.attributes ?? {}) as Record<string, string>;
    validateAttributeChanges(
      Object.entries(attrs).map(([key, value]) => ({ key, value })),
      { allowReservedAttributes: eventData?.allowReservedAttributes === true },
    );
    const existing = await getRunDoc(ctx, effectiveRunId);
    if (!existing) {
      const id = await ctx.db.insert("runs", {
        runId: effectiveRunId,
        status: "pending",
        deploymentId: eventData.deploymentId as string,
        workflowName: eventData.workflowName as string,
        specVersion: effectiveSpecVersion,
        input: stringifySubValue(eventData.input),
        executionContext: stringifySubValue(eventData.executionContext),
        attributesJson: JSON.stringify(attrs),
        createdAt: now,
        updatedAt: now,
      });
      const inserted = await ctx.db.get(id);
      if (inserted) run = encodeRun(inserted);
    }
  }

  if (eventType === "run_started") {
    // Idempotent for concurrent invocations: if already running, return the
    // run without inserting a duplicate run_started event.
    if (currentRunDoc?.status === "running") {
      return { run: encodeRun(currentRunDoc) };
    }
    if (currentRunDoc) {
      await ctx.db.patch(currentRunDoc._id, {
        status: "running",
        startedAt: now,
        updatedAt: now,
      });
      const updated = await ctx.db.get(currentRunDoc._id);
      if (updated) run = encodeRun(updated);
    }
  }

  if (
    eventType === "run_completed" ||
    eventType === "run_failed" ||
    eventType === "run_cancelled"
  ) {
    const doc = currentRunDoc ?? (await getRunDoc(ctx, effectiveRunId));
    if (!doc) {
      worldError("RUN_NOT_FOUND", `Workflow run "${effectiveRunId}" not found`);
    }
    if (isTerminal(doc.status)) {
      worldError(
        "ENTITY_CONFLICT",
        `Cannot transition run from terminal state "${doc.status}"`,
      );
    }
    if (eventType === "run_completed") {
      await ctx.db.patch(doc._id, {
        status: "completed",
        output: stringifySubValue(eventData?.output),
        completedAt: now,
        updatedAt: now,
      });
    } else if (eventType === "run_failed") {
      await ctx.db.patch(doc._id, {
        status: "failed",
        error: stringifySubValue(eventData?.error),
        errorCode: (eventData?.errorCode as string | undefined) ?? undefined,
        completedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(doc._id, {
        status: "cancelled",
        completedAt: now,
        updatedAt: now,
      });
    }
    const updated = await ctx.db.get(doc._id);
    if (updated) run = encodeRun(updated);
    // Delete all hooks and waits for this run to allow token reuse.
    await deleteHooksAndWaits(ctx, effectiveRunId);
  }

  if (eventType === "attr_set") {
    const changes = (eventData?.changes ?? []) as AttributeChange[];
    const writerType = (eventData?.writer as { type?: string } | undefined)
      ?.type;
    // Dedup pre-check for correlated workflow writes: a redelivered or
    // replayed duplicate must be rejected BEFORE materializing onto the run.
    if (correlationId && writerType === "workflow") {
      const duplicate = await getCorrelatedEvent(
        ctx,
        effectiveRunId,
        correlationId,
        "attr_set",
      );
      if (duplicate) {
        worldError(
          "ENTITY_CONFLICT",
          `attr_set for correlationId "${correlationId}" already exists in run "${effectiveRunId}"`,
        );
      }
    }
    const doc = currentRunDoc!;
    const existingAttrs = parseAttributes(doc.attributesJson);
    validateAttributeChanges(changes, {
      existingKeys: Object.keys(existingAttrs),
      allowReservedAttributes: eventData?.allowReservedAttributes === true,
    });
    const merged = applyAttributeChanges(existingAttrs, changes);
    await ctx.db.patch(doc._id, {
      attributesJson: JSON.stringify(merged),
      updatedAt: now,
    });
    const updated = await ctx.db.get(doc._id);
    if (updated) run = encodeRun(updated);
  }

  // Strip eventData from run_started (belongs on run_created only); for a
  // lazy step_started strip only the step input (it lands on the synthetic
  // step_created event below).
  let storedEventDataJson: string | undefined;
  if (eventType === "run_started") {
    storedEventDataJson = undefined;
  } else if (eventData !== undefined && eventData !== null) {
    if (eventType === "step_started" && "input" in eventData) {
      const { input: _stripped, ...rest } = eventData as Record<
        string,
        unknown
      >;
      storedEventDataJson = stringifySubValue(rest);
    } else {
      storedEventDataJson = args.eventDataJson;
    }
  }

  if (eventType === "step_created") {
    const existing = await getStepDoc(ctx, effectiveRunId, correlationId!);
    if (!existing) {
      const id = await ctx.db.insert("steps", {
        runId: effectiveRunId,
        stepId: correlationId!,
        stepName: eventData.stepName as string,
        status: "pending",
        input: stringifySubValue(eventData.input),
        attempt: 0,
        specVersion: effectiveSpecVersion,
        createdAt: now,
        updatedAt: now,
      });
      const inserted = await ctx.db.get(id);
      if (inserted) step = encodeStep(inserted);
    }
  }

  if (eventType === "step_started") {
    let stepDoc = validatedStep;

    if (lazyStepStart && !stepDoc) {
      // The step insert is the ownership claim; the synthetic step_created
      // event keeps replay consistent (it must observe step_created before
      // step_started).
      const id = await ctx.db.insert("steps", {
        runId: effectiveRunId,
        stepId: correlationId!,
        stepName: eventData.stepName as string,
        status: "pending",
        input: stringifySubValue(eventData.input),
        attempt: 0,
        specVersion: effectiveSpecVersion,
        createdAt: now,
        updatedAt: now,
      });
      stepDoc = await ctx.db.get(id);
      const syntheticExists = await getCorrelatedEvent(
        ctx,
        effectiveRunId,
        correlationId!,
        "step_created",
      );
      if (!syntheticExists) {
        await ctx.db.insert("events", {
          runId: effectiveRunId,
          eventId: `wevt_${ulid(now)}`,
          correlationId,
          eventType: "step_created",
          eventDataJson: stringifySubValue({
            stepName: eventData.stepName,
            input: eventData.input,
          }),
          specVersion: effectiveSpecVersion,
          createdAt: now,
        });
      }
      stepCreatedLazily = true;
    }

    // Retried steps may be scheduled for later.
    if (stepDoc?.retryAfter && stepDoc.retryAfter > now) {
      worldError(
        "TOO_EARLY",
        `Cannot start step "${correlationId}": retryAfter timestamp has not been reached yet`,
        { retryAfter: Math.ceil((stepDoc.retryAfter - now) / 1000) },
      );
    }

    if (!stepDoc) {
      worldError("WORLD_ERROR", `Step "${correlationId}" not found`);
    }
    if (isTerminal(stepDoc.status)) {
      worldError(
        "ENTITY_CONFLICT",
        `Cannot modify step in terminal state "${stepDoc.status}"`,
      );
    }
    await ctx.db.patch(stepDoc._id, {
      status: "running",
      attempt: stepDoc.attempt + 1,
      // Preserve the original first-start timestamp across retries.
      startedAt: stepDoc.startedAt ?? now,
      retryAfter: undefined,
      updatedAt: now,
    });
    const updated = await ctx.db.get(stepDoc._id);
    if (updated) step = encodeStep(updated);
  }

  if (
    eventType === "step_completed" ||
    eventType === "step_failed" ||
    eventType === "step_retrying"
  ) {
    const stepDoc = await getStepDoc(ctx, effectiveRunId, correlationId!);
    if (!stepDoc) {
      worldError("WORLD_ERROR", `Step "${correlationId}" not found`);
    }
    if (isTerminal(stepDoc.status)) {
      worldError(
        "ENTITY_CONFLICT",
        `Cannot modify step in terminal state "${stepDoc.status}"`,
      );
    }
    if (eventType === "step_completed") {
      await ctx.db.patch(stepDoc._id, {
        status: "completed",
        output: stringifySubValue(eventData?.result),
        completedAt: now,
        updatedAt: now,
      });
    } else if (eventType === "step_failed") {
      await ctx.db.patch(stepDoc._id, {
        status: "failed",
        error: stringifySubValue(eventData?.error),
        completedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(stepDoc._id, {
        status: "pending",
        error: stringifySubValue(eventData?.error),
        retryAfter: isoToMs(eventData?.retryAfter),
        updatedAt: now,
      });
    }
    const updated = await ctx.db.get(stepDoc._id);
    if (updated) step = encodeStep(updated);
  }

  if (eventType === "hook_created") {
    const token = eventData.token as string;
    const existingHook = await getHookDocByToken(ctx, token);
    if (existingHook) {
      if (
        existingHook.runId === effectiveRunId &&
        existingHook.hookId === correlationId
      ) {
        // Same (runId, hookId): either a replayed duplicate (hook_created
        // event exists → conflict) or an orphaned hook row from a partial
        // write (event missing → recover by emitting the event below).
        const existingEvent = await getCorrelatedEvent(
          ctx,
          effectiveRunId,
          correlationId!,
          "hook_created",
        );
        if (existingEvent) {
          worldError(
            "ENTITY_CONFLICT",
            `Hook "${correlationId}" already created`,
          );
        }
        hook = encodeHook(existingHook);
      } else {
        // Cross-run token conflict: record a hook_conflict event instead of
        // throwing, so the workflow fails gracefully when the hook is awaited.
        const conflictEventId = getEventId();
        const conflictDataJson = JSON.stringify({
          token,
          conflictingRunId: existingHook.runId,
        });
        await ctx.db.insert("events", {
          runId: effectiveRunId,
          eventId: conflictEventId,
          correlationId,
          eventType: "hook_conflict",
          eventDataJson: conflictDataJson,
          specVersion: effectiveSpecVersion,
          createdAt: now,
        });
        return {
          event: {
            eventId: conflictEventId,
            runId: effectiveRunId,
            eventType: "hook_conflict",
            correlationId,
            eventDataJson: conflictDataJson,
            specVersion: effectiveSpecVersion,
            createdAt: now,
          },
          run,
          step,
        };
      }
    } else {
      const id = await ctx.db.insert("hooks", {
        runId: effectiveRunId,
        hookId: correlationId!,
        token,
        metadata: stringifySubValue(eventData.metadata),
        ownerId: "",
        projectId: "",
        environment: "",
        specVersion: effectiveSpecVersion,
        isWebhook: (eventData.isWebhook as boolean | undefined) ?? undefined,
        isSystem: (eventData.isSystem as boolean | undefined) ?? false,
        createdAt: now,
      });
      const inserted = await ctx.db.get(id);
      if (inserted) hook = encodeHook(inserted);
    }
  }

  if (eventType === "hook_disposed" && correlationId) {
    const hookDoc = await getHookDocById(ctx, correlationId);
    if (!hookDoc) {
      worldError("ENTITY_CONFLICT", `Hook "${correlationId}" already disposed`);
    }
    await ctx.db.delete(hookDoc._id);
  }

  if (eventType === "wait_created") {
    const waitId = `${effectiveRunId}-${correlationId}`;
    const existing = await getWaitDoc(ctx, waitId);
    if (existing) {
      worldError("ENTITY_CONFLICT", `Wait "${correlationId}" already exists`);
    }
    const id = await ctx.db.insert("waits", {
      waitId,
      runId: effectiveRunId,
      status: "waiting",
      resumeAt: isoToMs(eventData?.resumeAt),
      specVersion: effectiveSpecVersion,
      createdAt: now,
      updatedAt: now,
    });
    const inserted = await ctx.db.get(id);
    if (inserted) wait = encodeWait(inserted);
  }

  if (eventType === "wait_completed") {
    const waitId = `${effectiveRunId}-${correlationId}`;
    const waitDoc = await getWaitDoc(ctx, waitId);
    if (!waitDoc) {
      worldError("WORLD_ERROR", `Wait "${correlationId}" not found`);
    }
    if (waitDoc.status === "completed") {
      worldError("ENTITY_CONFLICT", `Wait "${correlationId}" already completed`);
    }
    await ctx.db.patch(waitDoc._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });
    const updated = await ctx.db.get(waitDoc._id);
    if (updated) wait = encodeWait(updated);
  }

  // -- event log insert ---------------------------------------------------------
  // One-shot uniqueness for entity-creation events per (run, correlation,
  // type) — the Convex equivalent of workflow_events_entity_creation_unique.
  const isDeduplicatedCorrelatedEvent =
    eventType === "step_created" ||
    eventType === "hook_created" ||
    eventType === "wait_created" ||
    eventType === "attr_set";
  if (isDeduplicatedCorrelatedEvent && correlationId) {
    const duplicate = await getCorrelatedEvent(
      ctx,
      effectiveRunId,
      correlationId,
      eventType,
    );
    if (duplicate) {
      worldError(
        "ENTITY_CONFLICT",
        `${eventType} for correlationId "${correlationId}" already exists in run "${effectiveRunId}"`,
      );
    }
  }

  const finalEventId = getEventId();
  await ctx.db.insert("events", {
    runId: effectiveRunId,
    eventId: finalEventId,
    correlationId,
    eventType,
    eventDataJson: storedEventDataJson,
    specVersion: effectiveSpecVersion,
    createdAt: now,
  });

  const encodedEvent = {
    eventId: finalEventId,
    runId: effectiveRunId,
    eventType,
    correlationId,
    eventDataJson: storedEventDataJson,
    specVersion: effectiveSpecVersion,
    createdAt: now,
  };

  // run_started returns the full event log so the runtime skips the initial
  // events.list round-trip.
  let allEvents: EventResultEnc["events"];
  let cursor: string | null | undefined;
  let hasMore: boolean | undefined;
  if (eventType === "run_started" && run && args.skipPreload !== true) {
    const rows = await ctx.db
      .query("events")
      .withIndex("by_run", (q) => q.eq("runId", effectiveRunId))
      .order("asc")
      .collect();
    allEvents = rows.map(encodeEvent);
    cursor = allEvents.at(-1)?.eventId ?? null;
    hasMore = false;
  }

  return {
    event: encodedEvent,
    run,
    step,
    hook,
    wait,
    events: allEvents,
    cursor,
    hasMore,
    ...(stepCreatedLazily ? { stepCreated: true } : {}),
  };
}
