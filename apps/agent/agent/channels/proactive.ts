import { defineChannel, GET } from "eve/channels";

/**
 * Delivery target for agent-initiated work with no external destination:
 * reminders and webhook events created from the web chat run here. Sessions
 * only arrive via cross-channel `receive` from the reminders schedule or the
 * hooks channel. Each caller records the session in the Convex `inbox` table
 * so the dashboard lists it and renders the transcript live
 * (ui:sessionEvents).
 *
 * The single no-op route exists because eve resolves `receive(channel, …)`
 * targets by route fingerprint (module identity is lost across the compiled
 * per-entry bundles); a channel with no routes cannot be targeted.
 */
export default defineChannel({
  routes: [
    GET("/proactive/health", async () => new Response("ok", { status: 200 })),
  ],
  async receive(input, { send }) {
    // Every proactive delivery is a fresh session.
    return await send(input.message, {
      auth: input.auth,
      continuationToken: crypto.randomUUID(),
    });
  },
});
