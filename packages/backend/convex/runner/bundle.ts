"use node";

/**
 * Loader for the compiled eve server bundle (produced by `eve build` +
 * scripts/vendor-eve.mjs).
 *
 * The bundle is imported dynamically at runtime — NOT bundled by Convex's
 * esbuild pass — because it is a 5 MB ESM artifact with top-level await and
 * import.meta usage. It reaches this process one of two ways:
 *
 *  - Path mode (local dev): `EVE_BUNDLE_PATH` (deployment env var) points at
 *    packages/backend/eve-runtime/bundle on this machine.
 *  - Storage mode (Convex Cloud, or anywhere EVE_BUNDLE_PATH is unset): the
 *    active `eveBundles` manifest (uploaded by scripts/upload-bundle.mjs) is
 *    downloaded from Convex file storage into /tmp and imported from there.
 *    The active version is re-checked on every load call, so uploading a new
 *    bundle hot-swaps the agent without a code deploy.
 *
 * On import, the bundle's compiled-artifacts bootstrap runs: it installs the
 * agent manifest/module map and calls installConfiguredWorkflowWorld, which
 * builds world-convex from CONVEX_URL / WORLD_SERVICE_SECRET env vars — i.e.
 * the world running *inside* Convex points back at this same deployment.
 * WORLD_CONVEX_DISABLE_PUMP=1 keeps it from starting a competing queue pump
 * (the Convex scheduler delivers jobs instead).
 */

import { mkdir, mkdtemp, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

export interface EveBundle {
  /** `/.well-known/workflow/v1/flow` route handler — the execution engine. */
  POST(req: Request): Promise<Response>;
  /** Channel dispatcher: (h3-ish event, "METHOD /path", artifacts config). */
  dispatchChannelRequest(
    event: EveRouteEvent,
    routeKey: string,
    config: { appRoot?: string; dev: boolean },
  ): Promise<Response>;
  /**
   * Scheduled-task dispatcher (heartbeat et al). Absent when the agent was
   * built without any agent/schedules/*.md.
   */
  dispatchScheduleTask?(
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

type LoadedBundle = {
  bundle: EveBundle;
  bundlePath: string;
  /** Manifest version in storage mode; "path" in EVE_BUNDLE_PATH mode. */
  version: string;
};

let cached: Promise<LoadedBundle> | null = null;

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

export async function loadEveBundle(ctx: ActionCtx): Promise<LoadedBundle> {
  applyBundleEnv();

  const envPath = process.env.EVE_BUNDLE_PATH;
  if (envPath) {
    // Path mode (local dev): the bundle sits on this machine's disk and
    // never changes underneath a running deployment — cache forever. A
    // storage-mode bundle cached before EVE_BUNDLE_PATH was set (env edits
    // don't recycle warm processes) is discarded rather than served.
    const current = cached ? await cached.catch(() => null) : null;
    if (current && current.version === "path") return current;
    const loading = importBundle(envPath, "path");
    cached = loading;
    loading.catch(() => {
      cached = null;
    });
    return loading;
  }

  // Storage mode: resolve the active manifest on every call so a freshly
  // uploaded bundle takes effect on the next action without a redeploy.
  const manifest = await ctx.runQuery(internal.bundles.activeManifest, {});
  if (!manifest) {
    throw new Error(
      "No eve bundle available: EVE_BUNDLE_PATH is not set and no active " +
        "bundle manifest exists. Either set EVE_BUNDLE_PATH to a local " +
        "checkout of eve-runtime/bundle (dev) or upload the bundle with " +
        "`node scripts/upload-bundle.mjs` (cloud).",
    );
  }
  if (cached) {
    const current = await cached.catch(() => null);
    if (current && current.version === manifest.version) return cached;
  }
  cached = (async () => {
    const dir = await materializeBundle(ctx, manifest);
    return await importBundle(dir, manifest.version);
  })();
  cached.catch(() => {
    cached = null;
  });
  return cached;
}

async function importBundle(
  base: string,
  version: string,
): Promise<LoadedBundle> {
  // entry.mjs is generated by scripts/vendor-eve.mjs: _libs/eve.mjs's export
  // names are minified and NOT stable across builds, so the vendor step
  // recovers the mapping from index.mjs and emits stable re-exports.
  const entry = `${base.replace(/\/+$/, "")}/entry.mjs`;
  const mod = (await import(/* @vite-ignore */ entry)) as Record<
    string,
    unknown
  >;
  const bundle: EveBundle = {
    POST: mod.POST as EveBundle["POST"],
    dispatchChannelRequest:
      mod.dispatchChannelRequest as EveBundle["dispatchChannelRequest"],
    dispatchScheduleTask:
      mod.dispatchScheduleTask as EveBundle["dispatchScheduleTask"],
    getWorld: mod.getWorld as EveBundle["getWorld"],
  };
  if (typeof bundle.POST !== "function") {
    throw new Error(
      `eve bundle at ${entry} does not export POST — re-run \`eve build\` ` +
        "and scripts/vendor-eve.mjs (old bundles without entry.mjs must be " +
        "re-vendored and re-uploaded).",
    );
  }
  return { bundle, bundlePath: base, version };
}

type BundleManifest = {
  version: string;
  files: { path: string; storageId: string; size: number; sha256: string }[];
};

const DOWNLOAD_CONCURRENCY = 8;

async function exists(path: string): Promise<boolean> {
  return await stat(path).then(
    () => true,
    () => false,
  );
}

/**
 * Download the manifest's files into /tmp/eve-bundle/<version> and return
 * that directory. Concurrent writers (multiple processes on a dev machine;
 * on Lambda each instance owns its /tmp) are handled by staging + atomic
 * rename: whoever renames first wins, everyone else discards their staging
 * copy. A `.complete` sentinel distinguishes a finished directory from the
 * debris of a crashed writer.
 */
async function materializeBundle(
  ctx: ActionCtx,
  manifest: BundleManifest,
): Promise<string> {
  const root = join(tmpdir(), "eve-bundle");
  const target = join(root, manifest.version);
  const sentinel = join(target, ".complete");
  if (await exists(sentinel)) return target;

  await mkdir(root, { recursive: true });
  const staging = await mkdtemp(join(root, ".staging-"));
  try {
    const queue = [...manifest.files];
    const worker = async (): Promise<void> => {
      for (let file = queue.shift(); file; file = queue.shift()) {
        // commit() validated paths already; re-check before writing to disk.
        const dest = resolve(staging, file.path);
        if (!dest.startsWith(staging + sep)) {
          throw new Error(`bundle file escapes bundle dir: ${file.path}`);
        }
        const blob = await ctx.storage.get(file.storageId);
        if (!blob) {
          throw new Error(
            `bundle file missing from storage: ${file.path} (${file.storageId})`,
          );
        }
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, Buffer.from(await blob.arrayBuffer()));
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.min(DOWNLOAD_CONCURRENCY, manifest.files.length) },
        () => worker(),
      ),
    );
    await writeFile(join(staging, ".complete"), manifest.version);

    try {
      await rename(staging, target);
    } catch {
      if (await exists(sentinel)) {
        // Lost the race to a concurrent writer — use their copy.
        await rm(staging, { recursive: true, force: true });
      } else {
        // Partial directory left by a crashed writer — replace it.
        await rm(target, { recursive: true, force: true });
        await rename(staging, target);
      }
    }
    return target;
  } catch (err) {
    await rm(staging, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}
