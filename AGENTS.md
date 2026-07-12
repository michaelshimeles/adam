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
- Optional second product; not needed to run `adam`. It additionally requires a
  Convex CLI login on the worker host and creates real dev-cloud Convex
  projects when deploying. See `platform/README.md`.
