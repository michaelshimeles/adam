// Headless deployer: deploy an agent from a JSON config without the builder
// backend in the loop. Same pipeline the worker runs.
//
//   node src/cli.mjs configs/test-agent.json
//
// Config shape:
//   {
//     "name": "Haiku Scribe",
//     "model": "anthropic/claude-sonnet-5",
//     "instructions": "…markdown…",
//     "tools": { "saveNote": true, "listNotes": true, "clearNotes": true,
//                "workflowStats": true, "webFetch": true, "webSearch": true },
//     "schedule": { "enabled": false, "cron": "0 * * * *", "prompt": "…" },
//     "channels": { "webhook": { "enabled": false } },
//     "aiGatewayApiKey": "(optional)",
//     "convexDeployKey": "(optional — deploy into the key's own deployment)",
//     "webhookSecret": "(optional — kept stable on redeploy)",
//     "existing": { "projectSlug": "…", "deploymentName": "…", "deploymentUrl": "…" } (optional, redeploy)
//   }

import { readFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deployAgent } from "./pipeline.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const workRoot = join(here, "..", "workspaces");

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: node src/cli.mjs <config.json>");
  process.exit(1);
}

const raw = JSON.parse(await readFile(configPath, "utf8"));
const slug =
  raw.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "") || "agent";

const input = {
  config: {
    name: raw.name,
    slug,
    model: raw.model,
    instructions: raw.instructions,
    tools: {
      webFetch: true,
      webSearch: true,
      memory: true,
      skills: true,
      reminders: true,
      eventTriggers: true,
      receipts: true,
      extras: true,
      delegation: true,
      ...raw.tools,
    },
    timezone: raw.timezone ?? "UTC",
    schedule: raw.schedule,
    channels: {
      webhook: { enabled: false },
      telegram: { enabled: false, allowedUserIds: "" },
      ...raw.channels,
    },
  },
  aiGatewayApiKey: raw.aiGatewayApiKey,
  openRouterApiKey: raw.openRouterApiKey,
  telegramBotToken: raw.telegramBotToken,
  composioApiKey: raw.composioApiKey,
  convexDeployKey: raw.convexDeployKey,
  webhookSecret: raw.webhookSecret,
  existing: raw.existing,
};

await mkdir(workRoot, { recursive: true });

const t0 = Date.now();
const result = await deployAgent(input, {
  repoRoot,
  team: process.env.CONVEX_TEAM ?? "rasmic",
  workRoot,
  log: (line) => console.log(line),
  setStep: (step) => console.log(`\n===== step: ${step} =====`),
});

console.log(`\n✓ deployed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(JSON.stringify(result, null, 2));
