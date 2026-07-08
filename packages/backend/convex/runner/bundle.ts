"use node";

/**
 * Loader for the vendored eve server bundle (packages/backend/eve-runtime/
 * bundle, produced by `eve build` + scripts/vendor-eve.mjs).
 *
 * The bundle is imported dynamically at runtime — NOT bundled by Convex's
 * esbuild pass — because it is a 5 MB ESM artifact with top-level await and
 * import.meta usage. `EVE_BUNDLE_PATH` (deployment env var) points at the
 * bundle directory; for local dev that's the checkout path on this machine.
 *
 * On import, the bundle's compiled-artifacts bootstrap runs: it installs the
 * agent manifest/module map and calls installConfiguredWorkflowWorld, which
 * builds world-convex from CONVEX_URL / WORLD_SERVICE_SECRET env vars — i.e.
 * the world running *inside* Convex points back at this same deployment.
 * WORLD_CONVEX_DISABLE_PUMP=1 keeps it from starting a competing queue pump
 * (the Convex scheduler delivers jobs instead).
 */

export interface EveBundle {
  /** `/.well-known/workflow/v1/flow` route handler — the execution engine. */
  POST(req: Request): Promise<Response>;
  /** Channel dispatcher: (h3-ish event, "METHOD /path", artifacts config). */
  dispatchChannelRequest(
    event: EveRouteEvent,
    routeKey: string,
    config: { appRoot?: string; dev: boolean },
  ): Promise<Response>;
  /** Scheduled-task dispatcher (heartbeat et al). */
  dispatchScheduleTask(
    taskName: string,
    config: { appRoot?: string; dev: boolean },
  ): Promise<unknown>;
  /** The installed workflow world (world-convex). */
  getWorld(): Promise<{
    events: unknown;
    close?: () => Promise<void>;
  }>;
}

export interface EveRouteEvent {
  req: Request;
  context: { params: Record<string, string> };
  waitUntil: (p: Promise<unknown>) => void;
  res?: unknown;
}

let cached: Promise<{ bundle: EveBundle; bundlePath: string }> | null = null;

/**
 * Env the bundle expects, applied on EVERY load call — not just the first.
 *
 * Why every call: Convex's node executor can hand each action invocation a
 * fresh process.env, while Node's module registry keeps the bundle (and this
 * module's `cached`) warm across invocations. The flow handler's queue prefix
 * is baked into the bundle at build time (`ay(workflowCode, { namespace:
 * "eve..." })`), but the *enqueue* side resolves WORKFLOW_QUEUE_NAMESPACE
 * from env at call time. If a warm invocation runs without the env var, it
 * enqueues unnamespaced names (__wkf_workflow_*) that the handler then
 * rejects with "Unhandled queue" until the job dead-letters.
 *
 * "eve" + hex(agent name) matches deriveEveWorkflowQueueNamespace() in eve.
 */
function applyBundleEnv(): void {
  // The runtime executes in-process; the pump must stay off, and queue
  // pushes route through the Convex scheduler (see world/queue.ts).
  process.env.WORLD_CONVEX_DISABLE_PUMP = "1";
  process.env.WORKFLOW_QUEUE_NAMESPACE ??= `eve${Buffer.from(
    process.env.EVE_AGENT_NAME ?? "agent",
    "utf-8",
  ).toString("hex")}`;
}

export async function loadEveBundle(): Promise<{
  bundle: EveBundle;
  bundlePath: string;
}> {
  applyBundleEnv();
  if (cached) return cached;
  cached = (async () => {
    const base = process.env.EVE_BUNDLE_PATH;
    if (!base) {
      throw new Error(
        "EVE_BUNDLE_PATH is not set on the Convex deployment. " +
          "Point it at packages/backend/eve-runtime/bundle " +
          "(npx convex env set EVE_BUNDLE_PATH /abs/path).",
      );
    }
    const entry = `${base.replace(/\/+$/, "")}/_libs/eve.mjs`;
    const mod = (await import(/* @vite-ignore */ entry)) as Record<
      string,
      unknown
    >;
    // Aliases match .output/server/index.mjs's imports of _libs/eve.mjs:
    //   B → flow route POST, U → dispatchChannelRequest, G → getWorld
    // and _virtual/eve.schedule.mjs's:  R → dispatchScheduleTask
    const bundle: EveBundle = {
      POST: mod.B as EveBundle["POST"],
      dispatchChannelRequest: mod.U as EveBundle["dispatchChannelRequest"],
      dispatchScheduleTask: mod.R as EveBundle["dispatchScheduleTask"],
      getWorld: mod.G as EveBundle["getWorld"],
    };
    if (typeof bundle.POST !== "function") {
      throw new Error(
        `eve bundle at ${entry} does not export the expected aliases ` +
          "(B/U/G/R). Re-run `eve build` + `pnpm vendor:eve` — if the eve " +
          "version changed, the minified export names may need re-mapping.",
      );
    }
    return { bundle, bundlePath: base };
  })();
  cached.catch(() => {
    cached = null;
  });
  return cached;
}
