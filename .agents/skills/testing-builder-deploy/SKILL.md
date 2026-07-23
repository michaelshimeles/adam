---
name: testing-builder-deploy
description: Test adam's agent builder (platform/*) end-to-end — builder form, deploy pipeline, and the deployed eve-style agent page. Use when verifying builder UI, worker pipeline, or deployed agent web app changes.
---

# Testing the adam agent builder + deployed agent

## Stack to bring up (three processes + web app under test)
1. **builder-backend**: `cd platform/builder-backend && CONVEX_AGENT_MODE=anonymous npx convex dev` (local Convex on 3212/3213 if adam's own backend already holds 3210/3211). Set `PLATFORM_WORKER_SECRET` via `npx convex env set`.
2. **builder-web**: `cd platform/builder-web && npx vite --port 5175` with `.env.local` `VITE_BUILDER_CONVEX_URL=http://127.0.0.1:3212`.
3. **worker**: `cd platform/worker && node src/index.mjs` with `.env.local` pointing at the builder backend. Deploy jobs stay `pending` forever if the worker isn't running.

## Critical worker auth gotcha
- Cloud provisioning (`convex dev --once --configure new --team <team> --project <name> --dev-deployment cloud`) needs an authenticated Convex CLI. If the worker fails at provision with "let's get you logged in … Cannot prompt for input in non-interactive terminals", the worker process lacks auth. Fix: start the worker with `CONVEX_ACCESS_TOKEN` set to a **personal** access token (team tokens can't create projects), or ensure `~/.convex/config.json` holds a valid login. Restart the worker after fixing.
- `rsync` might be missing in fresh environments (`spawn rsync ENOENT`) — `sudo apt-get install -y rsync`.
- Node 24+ required; non-login shells may resolve Node 22 — `nvm use 24` first.

## Test flow that works well
1. Builder UI (http://localhost:5175) → New Agent: verify all sections (identity, instructions, tools, capabilities, channels, integrations, credential incl. optional Convex deploy key).
2. Deploy-key validation: submit an invalid value (e.g. `not-a-valid-key`) and expect a red Convex error "must be a deployment deploy key (starts with \"prod:<deployment-name>|\")". Clear it and submit to create the agent.
3. Deploy: click "Deploy to Convex"; watch the streamed log for materialize → build → provision → configure → bundle → web → verify. A healthy run takes ~1 min (may be longer on cold caches). Also tail the worker log file for progress instead of polling the UI.
4. Deployed app (`https://<deployment>.convex.site`): it's BYOK — enter an AI Gateway key via the key dialog. Type secrets with `DISPLAY=:0 xdotool type "$SECRET_NAME"` so the value never appears in your messages.
5. Exercise chat (e.g. "Remember that my favorite color is green"), thread switching (New chat → back), and Settings (Workflow Runs, run details, queue health, notepad).
6. Post-deploy guard: editing a live agent to add/remove a Convex deploy key should be rejected.

## Cleanup
Each deploy creates a real Convex project in the operator team (e.g. `rasmic`). Delete test projects from https://dashboard.convex.dev afterwards to avoid clutter.

## Devin Secrets Needed
- `CONVEX_PERSONAL_ACCESS_TOKEN` — worker cloud provisioning (project creation).
- `AI_GATEWAY_API_KEY` — BYOK chat turns on the deployed agent.
- `CONVEX_TEAM_ACCESS_TOKEN` — optional; insufficient for project creation on its own.
