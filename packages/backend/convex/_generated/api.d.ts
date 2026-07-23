/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentSkills from "../agentSkills.js";
import type * as bundles from "../bundles.js";
import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as keys from "../keys.js";
import type * as lib_attrs from "../lib/attrs.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_ids from "../lib/ids.js";
import type * as lib_modelKeys from "../lib/modelKeys.js";
import type * as lib_typedjson from "../lib/typedjson.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_worldStore from "../lib/worldStore.js";
import type * as memories from "../memories.js";
import type * as models from "../models.js";
import type * as notes from "../notes.js";
import type * as receipts from "../receipts.js";
import type * as reminders from "../reminders.js";
import type * as runner_bundle from "../runner/bundle.js";
import type * as runner_channels from "../runner/channels.js";
import type * as runner_engine from "../runner/engine.js";
import type * as runner_modelKeyLock from "../runner/modelKeyLock.js";
import type * as runner_probe from "../runner/probe.js";
import type * as runner_schedule from "../runner/schedule.js";
import type * as staticHosting from "../staticHosting.js";
import type * as triggers from "../triggers.js";
import type * as ui from "../ui.js";
import type * as world_events from "../world/events.js";
import type * as world_hooks from "../world/hooks.js";
import type * as world_queue from "../world/queue.js";
import type * as world_runs from "../world/runs.js";
import type * as world_steps from "../world/steps.js";
import type * as world_streams from "../world/streams.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentSkills: typeof agentSkills;
  bundles: typeof bundles;
  chat: typeof chat;
  crons: typeof crons;
  http: typeof http;
  inbox: typeof inbox;
  keys: typeof keys;
  "lib/attrs": typeof lib_attrs;
  "lib/auth": typeof lib_auth;
  "lib/errors": typeof lib_errors;
  "lib/ids": typeof lib_ids;
  "lib/modelKeys": typeof lib_modelKeys;
  "lib/typedjson": typeof lib_typedjson;
  "lib/validators": typeof lib_validators;
  "lib/worldStore": typeof lib_worldStore;
  memories: typeof memories;
  models: typeof models;
  notes: typeof notes;
  receipts: typeof receipts;
  reminders: typeof reminders;
  "runner/bundle": typeof runner_bundle;
  "runner/channels": typeof runner_channels;
  "runner/engine": typeof runner_engine;
  "runner/modelKeyLock": typeof runner_modelKeyLock;
  "runner/probe": typeof runner_probe;
  "runner/schedule": typeof runner_schedule;
  staticHosting: typeof staticHosting;
  triggers: typeof triggers;
  ui: typeof ui;
  "world/events": typeof world_events;
  "world/hooks": typeof world_hooks;
  "world/queue": typeof world_queue;
  "world/runs": typeof world_runs;
  "world/steps": typeof world_steps;
  "world/streams": typeof world_streams;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  selfHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"selfHosting">;
};
