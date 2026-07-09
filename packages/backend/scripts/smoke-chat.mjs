// E2E smoke test for the in-Convex eve runner: send a chat turn through the
// chat:send action (no eve server running), then follow the session's event
// stream and queue state until the turn completes.
import { ConvexHttpClient } from "convex/browser";

const url = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const client = new ConvexHttpClient(url);

// chat:send is BYOK: every send carries the caller's own AI Gateway key.
const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) {
  console.error("Set AI_GATEWAY_API_KEY — chat:send requires a gateway key.");
  process.exit(1);
}

const message =
  process.argv[2] ??
  "Hello! Please save a note titled 'convex-port' saying the runner works, then confirm.";

console.log("→ chat:send", JSON.stringify(message.slice(0, 80)));
const started = Date.now();
const res = await client.action("chat:send", { apiKey, message });
console.log("←", JSON.stringify(res));
if (!res.ok || !res.sessionId) process.exit(1);

const sessionId = res.sessionId;
let seq = 0;
let sawDone = false;
const deadline = Date.now() + 120_000;

// The session stream stays open across turns (it only closes when the session
// ends), so success for one turn = seeing turn.completed / session.waiting.
outer: while (Date.now() < deadline) {
  const page = await client.query("ui:sessionEvents", { sessionId, startSeq: seq });
  if (page) {
    for (const ev of page.events) {
      const t = ev?.type ?? "?";
      let detail = "";
      if (t === "text-delta") detail = JSON.stringify(ev.delta ?? ev.text ?? "");
      else if (t === "tool-input-available" || t === "tool-call")
        detail = ev.toolName ?? "";
      else if (t === "tool-output-available") detail = ev.toolName ?? "";
      else if (t === "error") detail = JSON.stringify(ev).slice(0, 300);
      console.log(`  [${t}] ${detail}`);
      if (
        t === "session.waiting" ||
        t === "turn.completed" ||
        t === "session.completed"
      ) {
        sawDone = true;
        break outer;
      }
    }
    seq = page.nextSeq;
    if (page.done) {
      sawDone = true;
      break;
    }
  }
  const health = await client.query("ui:queueHealth", {});
  if (health.dead > 1) {
    console.error("✗ new dead-lettered job detected", health);
    break;
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const runs = await client.query("ui:listRuns", { limit: 5 });
console.log("\nrecent runs:");
for (const r of runs) {
  console.log(`  ${r.runId} ${r.workflowName} → ${r.status}`);
}
const health = await client.query("ui:queueHealth", {});
console.log("queue:", JSON.stringify(health));
console.log(
  sawDone
    ? `✓ turn completed in ${((Date.now() - started) / 1000).toFixed(1)}s`
    : "✗ timed out waiting for turn completion",
);
process.exit(sawDone ? 0 : 1);
