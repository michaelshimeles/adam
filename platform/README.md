# eve agent builder

Configure an eve agent in a dashboard, click **Deploy**, get a live agent on
its own Convex project — chat UI, durable workflows, tools, HITL approvals,
cron schedules and all.

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

Open http://localhost:5175 — the header shows build-worker liveness; agents
list left, config form / detail + streaming deploy log right.

## Credentials model

- **Chat is BYOK**: visitors to the deployed agent's site paste their own AI
  Gateway key (validated, held server-side per session).
- **Schedules** run on the deployment's own `AI_GATEWAY_API_KEY`, provided
  (optionally) in the builder form and stored in the `agentSecrets` table —
  read only by the secret-guarded worker API, never returned to the browser.
- **Worker API** (`worker:claim/setStep/appendLogs/complete`) is gated by
  `PLATFORM_WORKER_SECRET`, same trust model as the agent backend's
  `WORLD_SERVICE_SECRET`.
- **Dashboard API** (`agents:*`) honors an optional access secret: set
  `BUILDER_DASHBOARD_SECRET` on the builder deployment and the web UI shows
  an unlock screen (the secret is kept in localStorage and sent with every
  call). Leave it unset for open local-dev use.

## Prototype caveats (before this is a product)

- Builder access is a single shared secret (`BUILDER_DASHBOARD_SECRET`),
  not per-user auth — a real deployment wraps `agents:*` in authed custom
  functions and scopes agents to owners.
- Gateway keys are stored plaintext in `agentSecrets`; vault/KMS-encrypt them.
- Provisioning uses the operator's Convex CLI login and creates **dev cloud**
  deployments; production would use the Management API with a team access
  token and prod deployments (the pipeline isolates this in one step).
- The worker runs jobs serially on the host machine; containerize per-job for
  isolation and parallelism.
- Deploys reuse the repo's `apps/agent` template; per-agent custom tools would
  need codegen or a tool marketplace.
