import { v } from "convex/values";

/**
 * Wire-shape validators for entities crossing the Convex ↔ world-convex
 * boundary. Payload fields are TypedJSON strings; timestamps are epoch ms;
 * run attributes travel as a JSON string (keys may use the reserved `$`
 * prefix, which Convex object fields disallow).
 */

export const encRunValidator = v.object({
  runId: v.string(),
  status: v.string(),
  deploymentId: v.string(),
  workflowName: v.string(),
  specVersion: v.optional(v.number()),
  input: v.optional(v.string()),
  output: v.optional(v.string()),
  error: v.optional(v.string()),
  errorCode: v.optional(v.string()),
  executionContext: v.optional(v.string()),
  attributesJson: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  expiredAt: v.optional(v.number()),
});

export const encStepValidator = v.object({
  runId: v.string(),
  stepId: v.string(),
  stepName: v.string(),
  status: v.string(),
  input: v.optional(v.string()),
  output: v.optional(v.string()),
  error: v.optional(v.string()),
  attempt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  retryAfter: v.optional(v.number()),
  specVersion: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const encHookValidator = v.object({
  runId: v.string(),
  hookId: v.string(),
  token: v.string(),
  ownerId: v.string(),
  projectId: v.string(),
  environment: v.string(),
  metadata: v.optional(v.string()),
  specVersion: v.optional(v.number()),
  isWebhook: v.optional(v.boolean()),
  isSystem: v.optional(v.boolean()),
  createdAt: v.number(),
});

export const encWaitValidator = v.object({
  waitId: v.string(),
  runId: v.string(),
  status: v.string(),
  resumeAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  specVersion: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const encEventValidator = v.object({
  eventId: v.string(),
  runId: v.string(),
  eventType: v.string(),
  correlationId: v.optional(v.string()),
  eventDataJson: v.optional(v.string()),
  specVersion: v.optional(v.number()),
  createdAt: v.number(),
});

export const eventResultValidator = v.object({
  event: v.optional(encEventValidator),
  run: v.optional(encRunValidator),
  step: v.optional(encStepValidator),
  hook: v.optional(encHookValidator),
  wait: v.optional(encWaitValidator),
  events: v.optional(v.array(encEventValidator)),
  cursor: v.optional(v.union(v.string(), v.null())),
  hasMore: v.optional(v.boolean()),
  stepCreated: v.optional(v.boolean()),
});

export const paginatedValidator = (item: any) =>
  v.object({
    data: v.array(item),
    cursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  });
