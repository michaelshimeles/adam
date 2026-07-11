// E2E test for long-turn execution under the Convex action ceiling.
//
// Phase 1 (straddle): pins the deployment's WORKFLOW_V2_TIMEOUT_MS low so the
// eve flow handler must yield mid-turn, then drives a chat turn whose chunked
// tool work (simulate_long_task) necessarily spans several yield budgets. The
// turn can only complete if every yield's continuation message was delivered
// by a fresh runner tick and the replay skipped completed steps — completion
// plus step-timing math therefore proves multi-delivery execution.
//
// Phase 2 (fan-out): additionally pins WORKFLOW_MAX_INLINE_STEPS=1 and asks
// the agent for parallel tool calls, so overflow steps ride the workflow
// queue as per-step flow messages. Whether the model actually parallelizes
// is model-dependent, so parallel dispatch is reported, not asserted; step
// completion and a clean queue are asserted.
//
// Prereqs: `npx convex dev` running in packages/backend, deployment env set
// per the README quickstart, and AI_GATEWAY_API_KEY in this script's env
// (chat:send is BYOK). Deployment env edits made by the test are restored on
// exit.
//
// Usage: node scripts/long-turn-test.mjs [--skip-fanout]

import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { ConvexHttpClient } from "convex/browser";

const execFileP = promisify(execFile);
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const url = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const client = new ConvexHttpClient(url);

const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) {
  console.error("Set AI_GATEWAY_API_KEY — chat:send requires a gateway key.");
  process.exit(1);
}
const skipFanout = process.argv.includes("--skip-fanout");

/** Forced yield budget for the test: far below the 120s production default. */
const V2_TIMEOUT_MS = 5_000;
const CHUNKS = 6;
const CHUNK_MS = 2_000;
const TURN_DEADLINE_MS = 300_000;

// -- deployment env helpers ---------------------------------------------------

async function convexEnv(...args) {
  return await execFileP("npx", ["convex", "env", ...args], {
    cwd: backendRoot,
  });
}

async function envGet(name) {
  try {
    const { stdout } = await convexEnv("get", name);
    const value = stdout.trim();
    return value === "" ? null : value;
  } catch {
    return null;
  }
}

const envRestores = [];

async function envSetForTest(name, value) {
  const previous = await envGet(name);
  envRestores.push({ name, previous });
  await convexEnv("set", name, value);
  console.log(`  env ${name}=${value} (was ${previous ?? "<unset>"})`);
}

async function restoreEnv() {
  for (const { name, previous } of envRestores.reverse()) {
    try {
      if (previous === null) await convexEnv("remove", name);
      else await convexEnv("set", name, previous);
      console.log(`  env ${name} restored to ${previous ?? "<unset>"}`);
    } catch (err) {
      console.error(`  ! failed to restore env ${name}:`, String(err));
    }
  }
  envRestores.length = 0;
}

// -- chat/session helpers -----------------------------------------------------

const TERMINALS = new Set([
  "session.waiting",
  "turn.completed",
  "session.completed",
]);

/**
 * Follow the session event stream from startSeq until the turn settles.
 * Samples queue health along the way (multi-delivery turns show the flow job
 * cycling through pending/claimed between yields).
 */
async function waitForTurn(sessionId, startSeq) {
  const deadline = Date.now() + TURN_DEADLINE_MS;
  let seq = startSeq;
  let sawDone = false;
  let busySamples = 0;
  let samples = 0;
  let sawError = null;

  while (Date.now() < deadline && !sawDone) {
    const page = await client.query("ui:sessionEvents", {
      sessionId,
      startSeq: seq,
    });
    if (page) {
      for (const ev of page.events) {
        const t = ev?.type ?? "?";
        if (t === "tool-input-available" || t === "tool-output-available") {
          console.log(`  [${t}] ${ev.toolName ?? ""}`);
        } else if (t === "error") {
          sawError = JSON.stringify(ev).slice(0, 300);
          console.log(`  [error] ${sawError}`);
        }
        if (TERMINALS.has(t)) {
          sawDone = true;
          break;
        }
      }
      seq = page.nextSeq;
      if (page.done) sawDone = true;
    }
    const health = await client.query("ui:queueHealth", {});
    samples += 1;
    if (health.pending + health.claimed > 0) busySamples += 1;
    if (!sawDone) await new Promise((r) => setTimeout(r, 500));
  }
  return { sawDone, nextSeq: seq, busySamples, samples, sawError };
}

/** Steps named after the tool, on runs created since the phase started. */
async function toolSteps(sinceMs, toolName) {
  const runs = await client.query("ui:listRuns", { limit: 30 });
  const found = [];
  for (const run of runs) {
    if (run.createdAt < sinceMs) continue;
    const steps = await client.query("ui:listSteps", { runId: run.runId });
    for (const step of steps) {
      if (step.stepName.includes(toolName) && step.createdAt >= sinceMs) {
        found.push({ ...step, runId: run.runId });
      }
    }
  }
  return found;
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

// -- phases ---------------------------------------------------------------

async function phaseStraddle() {
  console.log("\n== phase 1: one turn across multiple deliveries ==");
  const t0 = Date.now();
  const message =
    `Use simulate_long_task with task "straddle-demo", totalChunks ${CHUNKS}, ` +
    `chunkMs ${CHUNK_MS}, starting at cursor 0. Keep calling it with the ` +
    `returned cursor until done is true, then reply exactly LONG TASK COMPLETE.`;

  console.log("→ chat:send", JSON.stringify(message.slice(0, 88)));
  const res = await client.action("chat:send", { apiKey, message });
  if (!res.ok || !res.sessionId) {
    fail(`chat:send failed: ${JSON.stringify(res)}`);
    return null;
  }

  const turn = await waitForTurn(res.sessionId, 0);
  if (!turn.sawDone) {
    fail(`turn did not complete within ${TURN_DEADLINE_MS / 1000}s`);
    return null;
  }
  console.log(
    `  turn settled in ${((Date.now() - t0) / 1000).toFixed(1)}s ` +
      `(queue busy in ${turn.busySamples}/${turn.samples} samples)`,
  );

  const steps = await toolSteps(t0, "simulate_long_task");
  const completed = steps.filter((s) => s.status === "completed");
  if (completed.length !== CHUNKS) {
    fail(
      `expected ${CHUNKS} completed simulate_long_task steps, found ` +
        `${completed.length} (of ${steps.length} total: ` +
        `${steps.map((s) => `${s.stepName}:${s.status}`).join(", ")})`,
    );
    return { sessionId: res.sessionId, nextSeq: turn.nextSeq };
  }
  console.log(`  ${completed.length}/${CHUNKS} chunk steps completed, once each`);

  // Multi-delivery proof: the flow handler yields at the first step boundary
  // past V2_TIMEOUT_MS of a delivery, so tool work spanning more than the
  // budget cannot fit in one delivery — completion means the continuation
  // messages were delivered and replay resumed without re-running chunks.
  const started = Math.min(...completed.map((s) => s.startedAt ?? Infinity));
  const finished = Math.max(...completed.map((s) => s.completedAt ?? 0));
  const spanMs = finished - started;
  if (!(spanMs > V2_TIMEOUT_MS)) {
    fail(
      `tool steps spanned ${spanMs}ms — not above the ${V2_TIMEOUT_MS}ms ` +
        `yield budget, so this run does not exercise multi-delivery turns`,
    );
  } else {
    console.log(
      `✓ steps spanned ${(spanMs / 1000).toFixed(1)}s > ${V2_TIMEOUT_MS / 1000}s ` +
        `yield budget ⇒ ≥ ${Math.max(2, Math.ceil(spanMs / V2_TIMEOUT_MS))} deliveries for one turn`,
    );
  }
  return { sessionId: res.sessionId, nextSeq: turn.nextSeq };
}

async function phaseFanout(sessionId, startSeq) {
  console.log("\n== phase 2: parallel fan-out as per-step flow messages ==");
  await envSetForTest("WORKFLOW_MAX_INLINE_STEPS", "1");
  const t0 = Date.now();
  const message =
    `In a single response, call simulate_long_task four times in parallel — ` +
    `tasks "fan-a", "fan-b", "fan-c", "fan-d", each with totalChunks 1, ` +
    `chunkMs 1500, cursor 0. Then reply exactly FANOUT COMPLETE.`;

  console.log("→ chat:send", JSON.stringify(message.slice(0, 88)));
  const res = await client.action("chat:send", { apiKey, sessionId, message });
  if (!res.ok) {
    fail(`chat:send failed: ${JSON.stringify(res)}`);
    return;
  }

  // Continue the same session stream from where phase 1 left off, so the
  // first turn's terminal events can't satisfy this wait.
  const turn = await waitForTurn(sessionId, startSeq);
  if (!turn.sawDone) {
    fail(`fan-out turn did not complete within ${TURN_DEADLINE_MS / 1000}s`);
    return;
  }

  const steps = await toolSteps(t0, "simulate_long_task");
  const completed = steps.filter((s) => s.status === "completed");
  if (completed.length < 4) {
    fail(
      `expected ≥4 completed fan-out steps, found ${completed.length} ` +
        `(${steps.map((s) => `${s.stepName}:${s.status}`).join(", ")})`,
    );
    return;
  }
  console.log(`  ${completed.length} fan-out steps completed`);

  // Parallel dispatch is up to the model; observe rather than assert it.
  const intervals = completed
    .filter((s) => s.startedAt !== undefined && s.completedAt !== undefined)
    .map((s) => [s.startedAt, s.completedAt]);
  let maxOverlap = 0;
  for (const [start] of intervals) {
    const overlap = intervals.filter(([s, e]) => s <= start && start < e).length;
    maxOverlap = Math.max(maxOverlap, overlap);
  }
  console.log(
    maxOverlap >= 2
      ? `✓ ${maxOverlap} steps ran concurrently — background per-step dispatch exercised`
      : "  note: model issued the calls sequentially; parallel dispatch not exercised this run",
  );
}

// -- main -----------------------------------------------------------------

const baseline = await client.query("ui:queueHealth", {});
console.log("queue baseline:", JSON.stringify(baseline));
console.log(`forcing frequent yields for the test:`);
await envSetForTest("WORKFLOW_V2_TIMEOUT_MS", String(V2_TIMEOUT_MS));

try {
  const straddle = await phaseStraddle();
  if (straddle && !skipFanout && process.exitCode !== 1) {
    await phaseFanout(straddle.sessionId, straddle.nextSeq);
  } else if (skipFanout) {
    console.log("\n(fan-out phase skipped via --skip-fanout)");
  }

  const health = await client.query("ui:queueHealth", {});
  console.log("\nqueue after:", JSON.stringify(health));
  if (health.dead > baseline.dead) {
    fail(
      `dead-letter count rose ${baseline.dead} → ${health.dead} during the test`,
    );
  }
} finally {
  await restoreEnv();
}

console.log(process.exitCode === 1 ? "\n✗ FAILED" : "\n✓ PASSED");
process.exit(process.exitCode ?? 0);
