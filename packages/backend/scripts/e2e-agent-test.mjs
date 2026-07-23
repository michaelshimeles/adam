// E2E test for a builder-deployed agent: sends chat turns through chat:send
// and tails ui:sessionEvents (the same path the web UI uses), asserting the
// stream stays readable — including tool payloads with "$"-prefixed JSON
// keys (Composio), which used to crash the query.
import { ConvexHttpClient } from "convex/browser";

const URL = process.env.AGENT_URL;
const KEY = process.env.TEST_GATEWAY_KEY;
if (!URL || !KEY) {
  console.error("set AGENT_URL and TEST_GATEWAY_KEY");
  process.exit(1);
}
const client = new ConvexHttpClient(URL);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function eventText(event) {
  // Pull visible assistant text out of text-delta-ish events, best effort.
  const chunks = [];
  (function walk(node) {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node.text === "string" && node.type?.includes("text")) {
      chunks.push(node.text);
    }
    for (const value of Object.values(node)) walk(value);
  })(event);
  return chunks.join("");
}

async function runTurn(label, sendArgs, { timeoutMs = 180_000 } = {}) {
  console.log(`\n=== ${label} ===`);
  const result = await client.action("chat:send", {
    apiKey: KEY,
    provider: "gateway",
    ...sendArgs,
  });
  console.log("send →", JSON.stringify({ ok: result.ok, status: result.status, sessionId: result.sessionId, error: result.error }));
  if (!result.ok) return { failed: true };
  const sessionId = sendArgs.sessionId ?? result.sessionId;

  const started = Date.now();
  let startSeq = 0;
  let eventCount = 0;
  let terminal = null;
  const types = new Map();
  let sawStringEvents = false;
  let text = "";
  while (Date.now() - started < timeoutMs) {
    await sleep(2500);
    let page;
    try {
      // Advance with startSeq — the query caps at 500 events per page, so a
      // verbose Composio turn would otherwise never surface its terminal event.
      page = await client.query("ui:sessionEvents", { sessionId, startSeq });
    } catch (err) {
      console.log("✗ sessionEvents query THREW:", err.message.slice(0, 200));
      return { failed: true, sessionId };
    }
    if (!page) continue;
    if (page.events.length > 0) {
      sawStringEvents = page.events.every((e) => typeof e === "string");
    }
    const events = page.events.map((raw) => {
      try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
      catch { return null; }
    }).filter(Boolean);
    for (const event of events) {
      types.set(event.type, (types.get(event.type) ?? 0) + 1);
      const t = eventText(event);
      if (t) text += t;
      if (["session.waiting", "session.completed", "session.failed"].includes(event.type)) {
        terminal = event.type;
      }
    }
    startSeq = page.nextSeq;
    eventCount += events.length;
    if (events.length > 0) {
      process.stdout.write(`  events: ${eventCount}\r`);
    }
    if (terminal || (page.done && page.events.length < 500)) break;
  }
  console.log(`\n  terminal: ${terminal ?? "TIMEOUT"}; events-are-strings: ${sawStringEvents}`);
  console.log(`  event types: ${[...types.entries()].map(([k, n]) => `${k}×${n}`).join(", ")}`);
  if (text) console.log(`  text: ${text.slice(0, 400)}`);
  return { sessionId, terminal, types, text, failed: terminal === null || terminal === "session.failed" };
}

// --- 1. basic turn
const basic = await runTurn("basic turn", {
  message: "Reply with exactly: WAYNE_OK and nothing else.",
  clientContext: { eveWebModel: "anthropic/claude-haiku-4.5" },
});

// --- 2. composio connect flow (the $schema regression)
const composio = await runTurn("composio: connect to trello", {
  message: "Connect to Trello for me.",
  clientContext: { eveWebModel: "anthropic/claude-haiku-4.5" },
});

// --- 3. continue turn on the same session (continuation)
let followup = { failed: true };
if (composio.sessionId && !composio.failed) {
  followup = await runTurn("composio follow-up (same session)", {
    sessionId: composio.sessionId,
    message: "Thanks — summarize in one line what you just did and what you need from me.",
    clientContext: { eveWebModel: "anthropic/claude-haiku-4.5" },
  });
}

// --- 4. reminder create + manage list queries
const reminder = await runTurn("reminder create", {
  message: "Remind me to drink water in 2 minutes. Confirm in one short line.",
  clientContext: { eveWebModel: "anthropic/claude-haiku-4.5" },
});
const [reminders, memories, skills, triggers] = await Promise.all([
  client.query("reminders:list", {}),
  client.query("memories:list", {}),
  client.query("agentSkills:list", {}),
  client.query("triggers:list", {}),
]);
console.log(`\n=== manage queries ===`);
console.log(`  reminders: ${reminders.length}${reminders[0] ? ` (next: ${JSON.stringify(reminders[0].prompt).slice(0, 80)})` : ""}`);
console.log(`  memories: ${memories.length}, skills: ${skills.length}, triggers: ${triggers.length}`);

const failed = [basic, composio, followup, reminder].filter((r) => r.failed).length;
console.log(`\n=== RESULT: ${failed === 0 ? "ALL PASS" : `${failed} FAILED`} ===`);
process.exit(failed === 0 ? 0 : 1);
