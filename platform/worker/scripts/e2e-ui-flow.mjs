// E2E driver: exercises the builder backend through the same public
// mutations the web UI calls (agents:create → agents:requestDeploy), then
// follows the job like the dashboard does (agents:latestJob + agents:get)
// until the agent is live. The running worker executes the deploy.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";

const here = dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(join(here, "..", ".env.local"));

const client = new ConvexHttpClient(process.env.BUILDER_CONVEX_URL);
const gatewayKey = (await readFile("/tmp/e2e-key.txt", "utf8")).trim();

const agentId = await client.mutation("agents:create", {
  name: "Standup Scribe",
  model: "anthropic/claude-sonnet-5",
  instructions: `# Standup Scribe

You are Standup Scribe, a team standup companion.

- When someone shares a standup update, save it with save_note prefixed with their name and today's focus.
- Use list_notes to recap what the team shared when asked.
- Keep replies to two sentences max, friendly and direct.`,
  tools: { saveNote: true, listNotes: true, clearNotes: true, workflowStats: true },
  schedule: {
    enabled: true,
    cron: "0 * * * *",
    prompt:
      "Check workflow health with the workflow_stats tool. If anything looks unhealthy, save a short incident note prefixed with [heartbeat].",
  },
  aiGatewayApiKey: gatewayKey,
});
console.log("created agent", agentId);

const jobId = await client.mutation("agents:requestDeploy", { agentId });
console.log("deploy job", jobId);

const deadline = Date.now() + 8 * 60_000;
let lastStep = "";
for (;;) {
  if (Date.now() > deadline) {
    console.error("timed out waiting for deploy");
    process.exit(1);
  }
  const [agent, job] = await Promise.all([
    client.query("agents:get", { agentId }),
    client.query("agents:latestJob", { agentId }),
  ]);
  const step = `${agent?.status}/${job?.status}/${job?.step ?? "-"}`;
  if (step !== lastStep) {
    console.log(new Date().toISOString().slice(11, 19), step);
    lastStep = step;
  }
  if (agent?.status === "live") {
    console.log("\n✓ LIVE", {
      dashboardUrl: agent.dashboardUrl,
      deploymentName: agent.deploymentName,
      bundleVersion: agent.bundleVersion,
    });
    process.exit(0);
  }
  if (agent?.status === "failed") {
    console.error("\n✗ FAILED:", agent.lastError);
    const logs = await client.query("agents:jobLogs", { jobId });
    for (const row of logs.slice(-15)) console.error("  " + row.line);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 4000));
}
