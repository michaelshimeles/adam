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
    exports: v.array(v.string()),
    worldInstalled: v.boolean(),
    /** Presence (never values) of the model credentials the runner can use. */
    credentials: v.object({
      gatewayKey: v.boolean(),
      oidcToken: v.boolean(),
      openRouterKey: v.boolean(),
      providerOverrideInstalled: v.boolean(),
    }),
  }),
  handler: async () => {
    const { bundle, bundlePath } = await loadEveBundle();
    const world = await bundle.getWorld();
    return {
      node: process.version,
      bundlePath,
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
      credentials: {
        gatewayKey: (process.env.AI_GATEWAY_API_KEY ?? "").trim() !== "",
        oidcToken: (process.env.VERCEL_OIDC_TOKEN ?? "").trim() !== "",
        openRouterKey: (process.env.OPENROUTER_API_KEY ?? "").trim() !== "",
        providerOverrideInstalled:
          (globalThis as { AI_SDK_DEFAULT_PROVIDER?: unknown })
            .AI_SDK_DEFAULT_PROVIDER !== undefined,
      },
    };
  },
});
