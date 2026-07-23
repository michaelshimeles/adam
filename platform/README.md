# adam agent builder

Configure an agent in a dashboard, click **Deploy**, get a live agent on its
own Convex project — chat UI, durable workflows, tools, HITL approvals, cron
schedules and all.

```
platform/
├── builder-backend/   Convex app: agent configs, deploy jobs, job logs (control plane)
├── builder-web/       Svelte 5 dashboard: configure + one-click deploy + live logs
└── worker/            Build worker: turns a config into a live Convex deployment
```

## How a deploy works

The worker claims a job from builder-backend and runs the pipeline
(`worker/src/pipeline.mjs`):

1. **materialize** — copy `apps/agent` + `packages/backend` into a scratch
   workspace; write `agent.ts` (model), `instructions.md`, drop disabled
   tools, write `schedules/heartbeat.md` + a generated `convex/crons.ts`
   matching the configured cron. `node_modules` are symlinked from the repo.
2. **build** — `eve build` in the workspace agent.
3. **provision** — first deploy: `convex dev --once --configure new --team …
   --project <slug>-<hex> --dev-deployment cloud` creates the project and
   pushes the backend. Redeploys reuse the existing deployment and just push.
4. **configure** — set deployment env (`WORLD_SERVICE_SECRET`,
   `WORLD_EXECUTION_MODE=convex`, `CONVEX_URL`, `WORKFLOW_QUEUE_NAMESPACE`,
   optional `AI_GATEWAY_API_KEY` for schedule sessions).
5. **bundle** — `scripts/vendor-eve.mjs` + `scripts/upload-bundle.mjs`: the
   compiled eve bundle goes into Convex file storage; the runner downloads it
   to `/tmp` and imports it (uploading a new bundle hot-swaps the agent with
   no code deploy).
6. **web** — vite-build `apps/web` against the new deployment URL, upload via
   `static-hosting` → `https://<deployment>.convex.site`.
7. **verify** — `runner/probe:probe` (bundle imports, world installs) + a 200
   from the static site.

~55 s per deploy on a warm machine. The pipeline is also runnable headless:

```sh
cd platform/worker
node src/cli.mjs configs/test-agent.json
```

## Running it

One-time (already provisioned for this repo — deployment
`rosy-goldfish-504`, team `rasmic`, project `eve-agent-builder`):

```sh
cd platform/builder-backend
npx convex dev --once --configure new --team <team> --project <name> --dev-deployment cloud
npx convex env set PLATFORM_WORKER_SECRET <random-hex>
# optional but recommended for deployed builders: lock the dashboard API
npx convex env set BUILDER_DASHBOARD_SECRET <random-hex>
```

Then two processes:

```sh
# 1. the build worker (needs repo + Convex CLI login + node 24)
cd platform/worker
cp .env.example .env.local        # BUILDER_CONVEX_URL, PLATFORM_WORKER_SECRET, CONVEX_TEAM
node src/index.mjs

# 2. the dashboard
cd platform/builder-web
npx vite --port 5175              # VITE_BUILDER_CONVEX_URL to point elsewhere
```

Open http://localhost:5175 for the landing page, or http://localhost:5175/builder
for the agent builder. The builder header shows build-worker liveness; agents
list left, config form / detail + streaming deploy log right.

## Credentials model

- **A model API key is required** in the builder form before deploy — Vercel
  AI Gateway or OpenRouter, picked in the form. The worker sets it as
  `AI_GATEWAY_API_KEY` / `OPENROUTER_API_KEY` plus the
  `CHAT_USE_DEPLOYMENT_KEY=1` opt-in on the agent deployment; chat, schedules,
  and webhooks bill that key and the deployed site skips the visitor key
  dialog. Deployments without the opt-in (e.g. the adam demo, whose key exists
  only for schedules) stay visitor-BYOK.
- The key is stored in `agentSecrets` — read only by the secret-guarded worker
  API, never returned to the browser.
- **Worker API** (`worker:claim/setStep/appendLogs/complete`) is gated by
  `PLATFORM_WORKER_SECRET`, same trust model as the agent backend's
  `WORLD_SERVICE_SECRET`.
- **Dashboard API** (`agents:*`) honors an optional access secret: set
  `BUILDER_DASHBOARD_SECRET` on the builder deployment and the web UI shows
  an unlock screen (the secret is kept in localStorage and sent with every
  call). Leave it unset for open local-dev use.
- **Per-browser agent scoping**: each browser mints a random owner token on
  first visit (localStorage) and every `agents:*` call carries it. Agents are
  stamped with the creator's token — visitors to a shared builder only see
  their own agents. Pre-token rows are unclaimed (visible to everyone) until
  their next edit/deploy claims them. Clearing site data starts the browser
  with an empty builder; deployed agents themselves are unaffected.

## Prototype caveats (before this is a product)

- Ownership is a browser-local capability token, not user auth — no recovery
  if storage is cleared, no cross-device access. A real deployment wraps
  `agents:*` in authed custom functions and scopes agents to user accounts.
- Gateway keys are stored plaintext in `agentSecrets`; vault/KMS-encrypt them.
- Provisioning uses the operator's Convex CLI login and creates **dev cloud**
  deployments; production would use the Management API with a team access
  token and prod deployments (the pipeline isolates this in one step).
- The worker runs jobs serially on the host machine; containerize per-job for
  isolation and parallelism.
- Deploys reuse the repo's `apps/agent` template; per-agent custom tools would
  need codegen or a tool marketplace.
