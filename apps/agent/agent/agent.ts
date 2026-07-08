import { defineAgent } from "eve";

/**
 * The eve host is the only non-Convex process in this system. Selecting the
 * world-convex package here makes Convex the durable backend for everything
 * the Workflow SDK persists: run/step state, the message queue, hooks, and
 * live output streams.
 *
 * world-convex reads its connection from the environment (see .env.example):
 *   CONVEX_URL, WORLD_SERVICE_SECRET, WORKFLOW_LOCAL_BASE_URL
 */
export default defineAgent({
  model: "anthropic/claude-sonnet-5",
  experimental: {
    workflow: {
      world: "world-convex",
    },
  },
  build: {
    externalDependencies: ["world-convex"],
  },
});
