import { defineChannel } from "eve/channels";

/**
 * Delivery target for agent-initiated work with no external destination:
 * reminders and webhook events created from the web chat run here. It has
 * no inbound routes — sessions only arrive via cross-channel `receive` from
 * the reminders schedule or the hooks channel. Each caller records the
 * session in the Convex `inbox` table so the dashboard lists it and renders
 * the transcript live (ui:sessionEvents).
 */
export default defineChannel({
  routes: [],
  async receive(input, { send }) {
    // Every proactive delivery is a fresh session.
    return await send(input.message, {
      auth: input.auth,
      continuationToken: crypto.randomUUID(),
    });
  },
});
