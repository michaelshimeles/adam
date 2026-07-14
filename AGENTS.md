# AGENTS.md

## Cursor Cloud specific instructions

This is a pnpm 10 + Turborepo monorepo. See `README.md` (root Quickstart) and
`platform/README.md` for the authoritative dev commands; this section only
captures non-obvious caveats discovered while setting up the cloud environment.

### Node / package manager
- **Node 24+ is required.** A login shell resolves Node 24 and `pnpm` via nvm
  (nvm `default` alias is set to 24). If a command reports the wrong Node
  version, the non-login `PATH` may resolve `/exec-daemon/node` (v22, too old);
  fix it in that shell with `nvm use 24` (or
  `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"`). `pnpm` comes
  from corepack (pinned by the root `packageManager` field).
- The install warns that build scripts for `esbuild` / `@convex-dev/static-hosting`
  were ignored — this is expected and harmless; Vite/esbuild still work and the
  static-hosting build step is only needed for `deploy:web`.

### Convex backend (`packages/backend`) — the core service
- Start it headlessly with **`CONVEX_AGENT_MODE=anonymous npx convex dev`** (no
  Convex login/account needed). It serves a local deployment at
  `http://127.0.0.1:3210` and writes `packages/backend/.env.local`.
- On the very first run it prompts `Set up Convex AI files? (Y/n)` — answer
  **`n`** (don't commit those files).
- After the deployment exists, set its env vars once with `npx convex env set`
  (see README step 3): `WORLD_SERVICE_SECRET`, `WORLD_EXECUTION_MODE=convex`,
  `CONVEX_URL=http://127.0.0.1:3210`, `EVE_BUNDLE_PATH=$(pwd)/eve-runtime/bundle`.
  These live in the deployment, not in the repo, so re-set them if the local
  deployment is recreated.
- The eve bundle is checked in (`eve-runtime/bundle`); you only need
  `pnpm build` (which re-vendors it) after changing anything under `apps/agent`.

### Web dashboard (`apps/web`)
- Create `apps/web/.env.local` with `VITE_CONVEX_URL=http://127.0.0.1:3210`,
  then `pnpm dev` (Vite on port **5173**, hard-set in `vite.config.ts`). It
  talks only to Convex — the backend must be running first.

### Model credentials (BYOK)
- Agent turns (dashboard chat, `scripts/smoke-chat.mjs`, `scripts/hitl-test.mjs`)
  are **bring-your-own-key**: they require `AI_GATEWAY_API_KEY` **or**
  `OPENROUTER_API_KEY` (as env for the scripts, or entered in the dashboard's
  key dialog). Without a key the agent cannot run a turn.
- Everything else works **without** a model key: the `world-convex` e2e tests,
  the durable queue/scheduler, and the reactive notepad/observability UI.

### Lint / test / build
- **Lint = typecheck** (there is no ESLint config): `pnpm typecheck`.
- **`world-convex` e2e** needs a live local deployment:
  `cd packages/world-convex && CONVEX_URL=http://127.0.0.1:3210 WORLD_SERVICE_SECRET=dev-world-secret pnpm test`.
- `pnpm build` fans out through turbo and re-vendors the eve bundle.

### `platform/*` (agent builder, Product B)
- Optional second product; not needed to run `adam`. See `platform/README.md`.
- Three processes: `builder-backend` (`CONVEX_AGENT_MODE=anonymous npx convex dev`,
  set `PLATFORM_WORKER_SECRET`), `builder-web` (`npx vite --port 5175`, point it
  at the backend with `platform/builder-web/.env.local`
  `VITE_BUILDER_CONVEX_URL=...`), and the build worker (`platform/worker`,
  `node src/index.mjs` with `.env.local`).
- **A deploy job sits in `pending` ("deploying") forever unless the `worker`
  process is running** to claim it — the dashboard/control-plane and the worker
  are separate processes.
- The worker's deploy **pipeline cannot complete in a headless cloud env**:
  - `materialize` shells out to **`rsync`** (install it if missing; it is not
    in the base image).
  - `provision` runs `convex dev --configure new --dev-deployment cloud`, which
    **requires an authenticated Convex account** (creates a real cloud project
    in a team). With no login it fails fast: "let's get you logged in … Cannot
    prompt for input in non-interactive terminals". Needs `npx convex login`
    (interactive) or a Convex team access token — not available anonymously.
  - `materialize` + `build` (`eve build`) do work; only `provision` onward
    needs the Convex account.
- **Deploying with a `CONVEX_DEPLOY_KEY`:** the builder pipeline's `childEnv`
  (`platform/worker/src/util.mjs`) intentionally strips `CONVEX_DEPLOY_KEY`, and
  its default flow *creates a new project per agent* (`--configure new --team`),
  which a deployment-scoped key (`dev:<name>|…`) cannot do. To deploy to one
  existing cloud deployment with such a key, run the pipeline steps directly
  against it (with the key in the env, not via the worker): `convex dev --once`
  (push) → `convex env set …` (`WORLD_SERVICE_SECRET`, `WORLD_EXECUTION_MODE=convex`,
  `WORLD_CONVEX_DISABLE_PUMP=1`, `CONVEX_URL=https://<name>.convex.cloud`,
  `WORKFLOW_QUEUE_NAMESPACE=eve6167656e74`, optional `AI_GATEWAY_API_KEY`) →
  `node scripts/upload-bundle.mjs` → `vite build` + `static-hosting upload` →
  `convex run runner/probe:probe`. Do **not** set `EVE_BUNDLE_PATH` on cloud
  (it loads the bundle from file storage).
