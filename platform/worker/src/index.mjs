// The build worker: polls the builder backend for deploy jobs and runs the
// pipeline for each. Runs on any machine with the repo + Convex CLI login
// (locally today; a container image in production).
//
//   cp .env.example .env.local   # fill in BUILDER_CONVEX_URL + secret
//   pnpm --filter platform-worker start

import { mkdir } from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { deployAgent, teardownAgent } from "./pipeline.mjs";
import { sleep } from "./util.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const workRoot = join(here, "..", "workspaces");

try {
  process.loadEnvFile(join(here, "..", ".env.local"));
} catch {
  // Fine — env may come from the shell.
}

const builderUrl = process.env.BUILDER_CONVEX_URL;
const secret = process.env.PLATFORM_WORKER_SECRET;
const team = process.env.CONVEX_TEAM ?? "rasmic";
if (!builderUrl || !secret) {
  console.error("Set BUILDER_CONVEX_URL and PLATFORM_WORKER_SECRET (see .env.example)");
  process.exit(1);
}

const client = new ConvexHttpClient(builderUrl);
const workerId = `${hostname()}-${process.pid}`;
await mkdir(workRoot, { recursive: true });

console.log(`worker ${workerId} polling ${builderUrl} (team: ${team})`);

// Liveness ping, independent of the claim loop: long pipeline steps keep the
// worker away from `claim` for many minutes, and the backend reaps running
// jobs whose worker has no recent heartbeat.
setInterval(() => {
  client
    .mutation("worker:heartbeat", { secret, workerId })
    .catch(() => {});
}, 30_000).unref();

/** Batches log lines into appendLogs mutations (~1/s) so the UI streams. */
function makeJobLogger(jobId) {
  let buffer = [];
  let flushing = Promise.resolve();
  let timer = null;

  const flush = () => {
    if (buffer.length === 0) return flushing;
    const lines = buffer;
    buffer = [];
    flushing = flushing.then(() =>
      client
        .mutation("worker:appendLogs", { secret, jobId, lines })
        .catch((err) => console.error("appendLogs failed:", err.message)),
    );
    return flushing;
  };

  return {
    log: (line) => {
      console.log(`  ${line}`);
      buffer.push(line);
      if (buffer.length >= 25) {
        flush();
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          flush();
        }, 800);
      }
    },
    finish: async () => {
      if (timer) clearTimeout(timer);
      timer = null;
      await flush();
      await flushing;
    },
  };
}

for (;;) {
  let job = null;
  try {
    job = await client.mutation("worker:claim", { secret, workerId });
  } catch (err) {
    console.error("claim failed:", err.message);
    await sleep(5000);
    continue;
  }

  if (!job) {
    await sleep(3000);
    continue;
  }

  const label =
    job.kind === "delete"
      ? `delete "${job.name}"`
      : `deploy "${job.config.name}"`;
  console.log(`\n→ job ${job.jobId}: ${label}`);
  const logger = makeJobLogger(job.jobId);
  const setStep = async (step) => {
    logger.log(`===== ${step} =====`);
    await client
      .mutation("worker:setStep", { secret, jobId: job.jobId, step })
      .catch(() => {});
  };

  try {
    if (job.kind === "delete") {
      await teardownAgent(job, { repoRoot, log: logger.log, setStep });
      logger.log("✓ teardown finished — removing agent from the builder");
      await logger.finish();
      await client.mutation("worker:complete", {
        secret,
        jobId: job.jobId,
        ok: true,
      });
      console.log(`✓ job ${job.jobId} deleted agent "${job.name}"`);
      continue;
    }

    const result = await deployAgent(
      {
        config: job.config,
        aiGatewayApiKey: job.aiGatewayApiKey,
        telegramBotToken: job.telegramBotToken,
        composioApiKey: job.composioApiKey,
        webhookSecret: job.webhookSecret,
        existing: job.existing,
      },
      { repoRoot, team, workRoot, log: logger.log, setStep },
    );
    logger.log(`✓ live at ${result.dashboardUrl}`);
    await logger.finish();
    await client.mutation("worker:complete", {
      secret,
      jobId: job.jobId,
      ok: true,
      result,
    });
    console.log(`✓ job ${job.jobId} succeeded → ${result.deploymentName}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`✗ job ${job.jobId} failed:`, message);
    logger.log(`✗ ${message}`);
    await logger.finish();
    await client
      .mutation("worker:complete", {
        secret,
        jobId: job.jobId,
        ok: false,
        error: message.slice(0, 1500),
      })
      .catch((e) => console.error("complete failed:", e.message));
  }
}
