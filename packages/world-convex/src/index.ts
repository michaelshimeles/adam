import type { World } from "@workflow/world";
import { SPEC_VERSION_CURRENT } from "@workflow/world";
import { ConvexWorldClient } from "./client.js";
import { type ConvexWorldConfig, resolveConfig } from "./config.js";
import { createQueue } from "./queue.js";
import { createStorage } from "./storage.js";
import { createStreamer } from "./streamer.js";

export type { ConvexWorldConfig } from "./config.js";

/**
 * A Workflow SDK "World" backed entirely by Convex:
 *
 * - Storage  → Convex tables (runs/steps/events/hooks/waits), with the whole
 *              event-materialization running inside one Convex mutation
 * - Queue    → Convex `queueJobs` table + a reactive wake subscription; jobs
 *              are claimed with leases and delivered over HTTP to this host's
 *              workflow endpoints
 * - Streamer → Convex `streams`/`streamChunks` tables; live readers tail via
 *              a WebSocket subscription on the stream's meta row
 *
 * The eve/Nitro host process stays stateless: every durable byte lives in
 * Convex, so the host can crash/restart/redeploy freely.
 *
 * Configure eve with:
 *
 *   experimental: { workflow: { world: "world-convex" } },
 *   build: { externalDependencies: ["world-convex"] },
 *
 * Environment: CONVEX_URL, WORLD_SERVICE_SECRET (see config.ts).
 */
export function createWorld(overrides: Partial<ConvexWorldConfig> = {}): World {
  const config = resolveConfig(overrides);
  const client = new ConvexWorldClient(config);
  const storage = createStorage(client);
  const queue = createQueue(client, config);
  const streamer = createStreamer(client, config);

  return {
    specVersion: SPEC_VERSION_CURRENT,
    // In-process world: a process.exit() would kill the host without a
    // redelivery, so failures surface via the event log instead.
    processExitTriggersQueueRedelivery: false,

    ...storage,

    queue: queue.queue,
    createQueueHandler: queue.createQueueHandler,
    getDeploymentId: queue.getDeploymentId,

    streamFlushIntervalMs: streamer.streamFlushIntervalMs,
    streams: streamer.streams,

    async start() {
      await queue.start();
    },

    async close() {
      await queue.close();
      await client.close();
    },
  };
}

export default createWorld;
