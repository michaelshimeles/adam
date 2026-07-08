// E2E test for human-in-the-loop through the in-Convex runner:
//   1. seed a note, 2. ask the agent to clear the notepad,
//   3. answer every input.requested affirmatively (ask_question confirm
//      and/or the clear_notes tool approval), 4. assert the notepad is empty.
//
// Requires `npx convex dev` running in packages/backend. No eve server.
import { ConvexHttpClient } from "convex/browser";

const url = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const secret = process.env.WORLD_SERVICE_SECRET ?? "dev-world-secret";
const client = new ConvexHttpClient(url);

const deadline = Date.now() + 180_000;
const remaining = () => deadline - Date.now();

await client.mutation("notes:add", {
  secret,
  text: `hitl-test seed ${new Date().toISOString()}`,
  author: "hitl-test",
});
console.log("seeded 1 note; notes before:", (await client.query("notes:list", {})).length);

console.log("→ chat:send 'Clear the notepad'");
const first = await client.action("chat:send", {
  message: "Clear the notepad, please.",
});
console.log("←", JSON.stringify(first));
if (!first.ok || !first.sessionId) process.exit(1);

const sessionId = first.sessionId;
let continuationToken = first.continuationToken;
let seq = 0;
const answered = new Set();
let cleared = false;

function pickOption(request) {
  const options = request.options ?? [];
  const preferred = options.find((o) =>
    /^(confirm|approve|yes|allow)$/i.test(o.id),
  );
  return preferred ?? options[0];
}

// Success = the notepad is actually empty and the queue has drained. Turn
// boundary events are unreliable here: answering an input starts ANOTHER
// turn (which may raise another approval for clear_notes itself), so we just
// keep answering requests until the observable outcome lands.
while (remaining() > 0) {
  const page = await client.query("ui:sessionEvents", { sessionId, startSeq: seq });
  if (page) {
    for (const ev of page.events) {
      const t = ev?.type ?? "?";
      if (t === "input.requested") {
        for (const request of ev.data?.requests ?? []) {
          const requestId = request.requestId;
          if (!requestId || answered.has(requestId)) continue;
          answered.add(requestId);
          const option = pickOption(request);
          console.log(
            `  [input.requested] ${requestId} → responding`,
            option ? `optionId=${option.id}` : "text=yes",
          );
          const res = await client.action("chat:send", {
            sessionId,
            continuationToken,
            inputResponses: [
              option
                ? { requestId, optionId: option.id }
                : { requestId, text: "yes" },
            ],
          });
          console.log("  ←", JSON.stringify(res));
          if (!res.ok) process.exit(1);
          if (res.continuationToken) continuationToken = res.continuationToken;
        }
      } else if (t === "tool-output-available") {
        console.log(`  [${t}] ${ev.toolName ?? ""}`);
      } else if (t === "error") {
        console.log(`  [error] ${JSON.stringify(ev).slice(0, 300)}`);
      } else {
        console.log(`  [${t}]`);
      }
    }
    seq = page.nextSeq;
  }

  const notes = await client.query("notes:list", {});
  const health = await client.query("ui:queueHealth", {});
  if (
    answered.size > 0 &&
    notes.length === 0 &&
    health.pending === 0 &&
    health.claimed === 0
  ) {
    cleared = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const notesAfter = await client.query("notes:list", {});
const health = await client.query("ui:queueHealth", {});
console.log("\nnotes after:", notesAfter.length, "queue:", JSON.stringify(health));

console.log(
  cleared
    ? `✓ HITL approval round-trip cleared the notepad (${answered.size} request(s) answered)`
    : "✗ HITL flow did not complete as expected",
);
process.exit(cleared ? 0 : 1);
