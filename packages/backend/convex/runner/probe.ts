"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { loadEveBundle } from "./bundle";

/** Feasibility probe: can this deployment import the vendored eve bundle? */
export const probe = internalAction({
  args: {},
  returns: v.object({
    node: v.string(),
    bundlePath: v.string(),
    version: v.string(),
    exports: v.array(v.string()),
    worldInstalled: v.boolean(),
  }),
  handler: async (ctx) => {
    const { bundle, bundlePath, version } = await loadEveBundle(ctx);
    const world = await bundle.getWorld();
    return {
      node: process.version,
      bundlePath,
      version,
      exports: ["POST", "dispatchChannelRequest", "getWorld"].filter(
        (k) =>
          typeof (bundle as unknown as Record<string, unknown>)[
            k === "POST" ? "POST" : k
          ] !== "undefined",
      ),
      worldInstalled:
        typeof world === "object" &&
        world !== null &&
        typeof (world as { events?: unknown }).events === "object",
    };
  },
});
