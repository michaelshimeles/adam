# adam

[eve](https://vercel.com/docs/agents/eve) is Vercel's durable AI agent runtime.
Out of the box it runs as a long-lived Node server and persists its state
through the Workflow SDK's "world" — Postgres + Redis locally, Vercel's
managed queues in production.

**adam** ports the whole thing onto **[Convex](https://convex.dev)**. Not just
the durable state — the *execution engine itself*. `eve build` is used as a
compiler; the emitted server bundle is vendored into the Convex deployment and
executed inside Convex `"use node"` actions. At runtime there is no eve
server. One Convex deployment runs and stores everything:

- **The agent runtime** — eve's workflow handler + channel API, invoked
  in-process by Convex actions (`runner/engine`, `chat:send`)
- **Workflow state** — runs, steps, events, hooks (event-sourced, transactional)
- **Message queue** — leased jobs with retries, backoff, idempotency; delivery
  is driven by the Convex scheduler, with crons as a safety net
- **Live streams** — model/session output chunks written to Convex, decoded
  server-side and tailed reactively by the UI
- **Schedules** — eve's markdown schedules (`heartbeat.md`) mapped to Convex
  crons
- **App data** — the demo agent's "team notepad" tool writes ordinary Convex
  documents next to the workflow tables
- **The dashboard itself** — a Svelte 5 app served from Convex static hosting

```
┌──────────────────────────────────────────────────────────────────┐
│  Convex deployment (packages/backend)                            │
│                                                                  │
│   chat:send ─────────► eve channel API ─┐                        │
│   (action, "use node")                  │ enqueue                │
│       │ inline fast path                ▼                        │
│       └─► deliverSessionInline   world/queue                     │
│           (same action)          (mutations)                     │
│                                         │ ctx.scheduler          │
│                                         ▼                        │
│                                  runner/engine:tick              │
│                                  (action, "use node")            │
│                                    │ imports vendored eve bundle │
│                                    ▼                             │
│                            workflow POST handler                 │
│                            (agent loop, models, tools)           │
│                                    │                             │
│   world/runs · steps · events · hooks · streams ◄────────────────┤
│   crons: lease reaper · sweep · heartbeat schedule               │
│   notes (app data) · static hosting (the web UI)                 │
└───────────────▲──────────────────────────────────────────────────┘
                │ convex-svelte (one WebSocket, all live)
        ┌───────┴──────────────────────────────────────┐
        │  Svelte 5 dashboard (apps/web)               │
        │  chat + HITL · notepad · runs/steps/streams  │
        └──────────────────────────────────────────────┘
```

## Repo layout

| Path | What it is |
| --- | --- |
| `packages/backend` | The Convex deployment: world tables + functions, the in-Convex eve runner (`convex/runner/*`, `convex/chat.ts`), crons, `notes` app table, static hosting, public `ui` queries, and the vendored eve bundle (`eve-runtime/`) |
| `packages/world-convex` | Implementation of `@workflow/world` (Storage + Queue + Streamer) backed by the Convex deployment. Compiled into the eve bundle via `experimental.workflow.world` |
| `apps/agent` | The eve project: agent definition, Convex-backed tools (`save_note`, `list_notes`, `clear_notes` w/ HITL approval, `workflow_stats`, `get_time`, `simulate_long_task` for chunked long work), heartbeat schedule. Built with `eve build`, never started as a server |
| `apps/web` | Svelte 5 + convex-svelte dashboard: chat with the agent (streaming + HITL), live notepad, run/step/event/stream observability |
| `platform/*` | The **adam agent builder**: configure an agent (model, instructions, tools, schedule) in a dashboard and one-click deploy it to its own Convex project, with stuck deploy/delete job recovery (reaper cron, cancel, worker heartbeat). See [platform/README.md](platform/README.md) |

## How the port works

1. **Compile** — `eve build` (in `apps/agent`) emits a self-contained ESM
   bundle: the agent loop, model calls, tool defs, the Workflow SDK runtime,
   and `world-convex` all in one file. `scripts/vendor-eve.mjs` copies it into
   `packages/backend/eve-runtime/bundle/` (the Nitro HTTP entrypoint is
   deliberately excluded) and generates `entry.mjs` with stable names for the
   bundle's minified exports (they change every build).
2. **Execute** — eve's engine is stateless request/response at its core: flow
   jobs arrive as HTTP `Request`s and return `{ok}` or `{timeoutSeconds}`.
   `convex/runner/engine.ts` (a `"use node"` action) imports the bundle,
   claims jobs from the Convex queue, fabricates those `Request`s, and calls
   the handler in-process. Suspensions become queue reschedules.
3. **Deliver** — the queue mutations (`world/queue.ts`) schedule a runner tick
   via `ctx.scheduler.runAfter(...)` whenever a job becomes due
   (`WORLD_EXECUTION_MODE=convex`). No polling, no pump. Crons requeue expired
   leases and sweep anything a deploy interrupted. The runner also normalizes
   queue names at delivery time (`__wkf_*` → `__<namespace>_wkf_*`), so an
   enqueue that raced deployment startup before `WORKFLOW_QUEUE_NAMESPACE`
   was visible can't strand a job.
4. **Chat** — `convex/chat.ts` exposes `chat:send`, which invokes the bundled
   channel API (session create / message send / HITL responses) the same way
   the eve HTTP server would have. Session transcripts are world streams;
   `ui:sessionEvents` decodes their binary framing (length-prefixed
   devalue-encoded frames) server-side and returns structured events that the
   dashboard consumes as a plain reactive query.
5. **Inline fast path** — after dispatching, `chat:send` delivers its own
   session's queue jobs in-process (`deliverSessionInline`) instead of
   waiting for a scheduled tick: the action is already warm with the bundle
   loaded and the visitor's key injected, so a simple warm turn drops from
   ~13s to roughly the model's own latency (~3s). New chats hand delivery to
   an immediately-scheduled `inlineSession` action so the fresh session id
   returns to the client right away (it re-reads the key from `sessionKeys` —
   never from scheduler args). Durability is unchanged: jobs are still
   journaled with leases, scheduled ticks remain the fallback/recovery path,
   and an inline failure never fails an already-enqueued send.
6. **Schedules** — `agent/schedules/heartbeat.md` is mirrored by a Convex cron
   that calls the bundle's schedule dispatcher hourly.

The dashboard's chat is Convex-native: it calls `chat:send` and subscribes to
`ui:sessionEvents`, reusing eve's client-side message reducer for rendering —
`useEveAgent` and its SSE transport are gone.

## Quickstart

Prereqs: **Node 24+**, **pnpm 10**.

```bash
pnpm install
```

**1. Start Convex** (terminal 1):

```bash
cd packages/backend
npx convex dev          # local deployment at http://127.0.0.1:3210
```

**2. Vendored runtime** — `packages/backend/eve-runtime/bundle` is checked in,
so nothing to do on first run. After changing anything under `apps/agent`
(agent, tools, instructions, schedules), rebuild it:

```bash
pnpm build              # turbo build + re-vendors apps/agent/.output → packages/backend/eve-runtime
```

**3. Configure the deployment** (terminal 2):

```bash
cd packages/backend
npx convex env set WORLD_SERVICE_SECRET dev-world-secret
npx convex env set WORLD_EXECUTION_MODE convex
npx convex env set CONVEX_URL http://127.0.0.1:3210
npx convex env set EVE_BUNDLE_PATH "$(pwd)/eve-runtime/bundle"

# model credentials — a Vercel AI Gateway key:
npx convex env set AI_GATEWAY_API_KEY <your-key>
# ...or an OpenRouter key (used only when no gateway credential is set):
npx convex env set OPENROUTER_API_KEY <your-key>
# ...or a Vercel OIDC token (expires ~12h; fine for a quick demo):
#   cd apps/agent && npx vercel link && npx vercel env pull
#   npx convex env set VERCEL_OIDC_TOKEN <token from apps/agent/.env>
# NOTE: this deployment key only pays for the hourly heartbeat schedule.
# Dashboard chats are BYOK: each visitor enters their own key
# (AI Gateway or OpenRouter — the key dialog accepts both).
```

**4. Start the dashboard** (terminal 3):

```bash
cd apps/web
pnpm dev                # http://localhost:5173 — talks only to Convex
```

Open the dashboard and try:

- *"Save a note: eve is running on Convex end to end"* — the turn is enqueued,
  a scheduler tick fires the runner action, the agent streams tokens into a
  world stream, and the notepad panel updates when the tool's mutation commits.
- *"What time is it in Toronto?"* — the `get_time` tool gives the agent a
  clock (ISO + localized to any IANA timezone).
- *"Clear the notepad"* — `clear_notes` requires approval; the HITL card is
  answered through `chat:send` with an input response, resuming the suspended
  workflow via a Convex-backed hook.
- Click any run in the right rail to watch steps, the event log, and the live
  output stream — all reactive queries over the world tables.

Scripted equivalents (no browser needed), with `npx convex dev` running:

```bash
cd packages/backend
node scripts/smoke-chat.mjs     # one full turn through the in-Convex runner
node scripts/hitl-test.mjs      # approval round-trip for clear_notes
```

## How world-convex works

**Storage** — every Workflow SDK event (`run_created`, `step_completed`,
`hook_received`, …) is applied by a single Convex mutation
(`world/events:create`) that appends the event **and** materializes the
run/step/hook row in the same transaction. ULID event ids give a total order;
payloads (input/output/errors) are opaque TypedJSON so `Uint8Array` and
`Date` survive the trip.

**Queue** — `queue:push` enqueues a job with a `jobKey` for idempotency. In
Convex mode each state change schedules `runner/engine:tick`, which claims
batches with short leases, executes them against the bundled workflow handler,
then completes / reschedules / releases. A cron reaps expired leases and
dead-letters jobs that exhaust their attempts; `maxDeliveries` is bumped only
on real deliveries. (`world-convex` also ships an HTTP pump for running eve as
a classic external host — unused here, disabled via `WORLD_CONVEX_DISABLE_PUMP`.)

**Streams** — stream writes buffer ~25 ms then flush ordered chunks
(`seq`-numbered) into `streamChunks`. Session streams carry framed events;
`ui:sessionEvents` decodes the framing server-side. The dashboard subscribes
to that query and to `ui:streamText` for live tails.

**Errors** — the backend throws structured `ConvexError`s
(`{ worldError: { code, ... } }`) which the client maps back to typed
`@workflow/errors` classes, so eve's retry/conflict semantics are preserved.

## Long turns and the action ceiling

Convex `"use node"` actions are killed at ~10 minutes, and one runner tick
executes whole flow deliveries in-process — so how does an agent turn that
needs 40 minutes of model calls and tool work survive? Two cooperating
budgets, both far below the ceiling:

- **The flow handler self-yields.** eve's run loop checks
  `WORKFLOW_V2_TIMEOUT_MS` (pinned to eve's 120s default in
  `runner/bundle.ts`) at every step boundary; past it, the handler enqueues
  a continuation flow message for the run and returns. The next delivery —
  usually in a fresh action — replays the event log, skips completed steps,
  and continues. One long turn becomes many short deliveries by design, not
  via crash recovery.
- **The tick reserves a window per delivery.** `runner/engine.ts` stops
  claiming new jobs once less than `RUNNER_DELIVERY_RESERVE_MS` (default
  4 min) of its `RUNNER_SAFE_BUDGET_MS` (default 9.5 min) remains, and
  schedules a successor tick that starts with a full window. A delivery is
  never started so late that a normal yield can't finish inside the action.

The one thing budgets can't save is a **single step body** (one tool call,
one model call) that outruns the remaining window: step bodies can't be
suspended. The kill path then takes over — lease expiry, `requeueExpired`
cron, deterministic replay — and after 5 consecutive lease recoveries with
no normal settle the job dead-letters (`recoveredCount` in `queueJobs`)
instead of crash-looping forever. Write long tools so this can't happen:

- **Chunk the work** (`simulate_long_task` is the template): do a bounded
  chunk per call, return `{done: false, cursor}`, and let the agent loop
  call again until done. Each call is its own durable step; the turn
  straddles deliveries via the yields above.
- **Externalize + hook** for work that runs elsewhere: kick it off in one
  quick step, then suspend on a hook (the same machinery as `clear_notes`
  HITL approval). A suspended run holds **no** action open at all; the
  callback re-enqueues it.

`scripts/long-turn-test.mjs` proves the whole story end-to-end (see Tests).

## Queue ops

Everything is observable in the dashboard (queue health chip) and the Convex
dashboard's `queueJobs` table. A job dead-letters for one of two reasons,
both preserved in its `lastError`:

- **Failed deliveries**: the handler errored `maxFails` (3) consecutive times.
- **Crash loop**: the lease expired 5 consecutive times without a normal
  settle — the worker keeps dying mid-delivery, almost always a single step
  outrunning the action window (fix the tool: chunk it or move it behind a
  hook).

Two internal mutations help once a job is dead:

```bash
cd packages/backend
npx convex run world/queue:reviveDead   # dead → pending with a fresh delivery budget
npx convex run world/queue:purgeDead    # drop all dead jobs
```

`reviveDead` is always safe: workflows are event-sourced and replay
deterministically, so re-delivering a job resumes exactly where the run left
off (completed steps are not re-executed). A daily cron purges dead jobs
older than 7 days either way.

## Deploying

```bash
cd packages/backend
npx convex deploy
# set the same env vars as the quickstart on prod (--prod), with a strong
# WORLD_SERVICE_SECRET and CONVEX_URL=https://<name>.convex.cloud — but do
# NOT set EVE_BUNDLE_PATH on cloud deployments (see below)

# ship the agent bundle into the deployment's file storage:
CONVEX_URL=https://<name>.convex.cloud \
WORLD_SERVICE_SECRET=<secret> node scripts/upload-bundle.mjs

# dashboard → Convex static hosting, from the repo root:
VITE_CONVEX_URL=https://<name>.convex.cloud pnpm deploy:web
# served at https://<name>.convex.site, SPA-fallback included
```

**How the bundle reaches Convex Cloud:** on cloud deployments node actions
run in Convex's environment, so a local `EVE_BUNDLE_PATH` directory doesn't
exist there. When `EVE_BUNDLE_PATH` is unset, the runner instead resolves the
active `eveBundles` manifest (pushed by `scripts/upload-bundle.mjs`),
downloads its files from Convex file storage into `/tmp`, and imports the
bundle from there (`runner/bundle.ts`). The active version is re-checked on
every load, so uploading a new bundle hot-swaps the agent on the next action —
no `convex deploy` needed for agent-only changes. Convex Cloud's node runtime
currently matches `eve build`'s Node 24 output, verified end-to-end (probe,
heartbeat schedule, chat turn with tools, HITL approval).

## Tests

`packages/world-convex/test/world.e2e.test.ts` runs the full world contract
against a live local deployment: TypedJSON round-trips, event materialization,
queue lease/retry/idempotency/dead-letter, hook conflicts, and live stream
reads.

```bash
cd packages/backend && npx convex dev   # must be running
cd packages/world-convex && pnpm test
```

`scripts/smoke-chat.mjs` and `scripts/hitl-test.mjs` (in `packages/backend`)
cover the in-Convex execution path: chat turn end-to-end, session
continuation, and human-in-the-loop approval.

`scripts/long-turn-test.mjs` covers the action-ceiling machinery: it pins
`WORKFLOW_V2_TIMEOUT_MS` low on the dev deployment (restored afterwards),
drives a chunked `simulate_long_task` turn that cannot fit in one delivery,
and asserts the turn completes with every chunk executed exactly once and no
dead-letters — proof that yield → continuation → replay works. A second
phase sets `WORKFLOW_MAX_INLINE_STEPS=1` and requests parallel tool calls to
exercise background per-step flow messages (reported, not asserted — models
don't always parallelize).

`pnpm typecheck` / `pnpm build` fan out through turbo; `pnpm build` also
re-vendors the eve bundle.

## Design notes & limits

- **eve was built to be a server; here it's a library.** The port works
  because eve's engine is stateless request/response under the hood — every
  flow job is an HTTP request, every suspension a reschedule. The Convex
  runner speaks that protocol in-process. A single *step body* (one model
  call, one tool call) runs inside one action invocation; whole turns
  straddle as many invocations as they need via the flow handler's yield
  budget (see "Long turns and the action ceiling"), and durability between
  invocations is exactly the world state in Convex tables.
- **What's genuinely gone:** the Nitro HTTP server, the queue pump, SSE
  transport to the browser, and every non-Convex runtime dependency
  (Postgres/Redis). What remains from Vercel: `eve build` as a compile step
  and the AI Gateway for model credentials (OpenRouter works as a drop-in
  alternative — see BYOK below).
- **Env vars the runner needs** (see quickstart): `CONVEX_URL`,
  `WORLD_SERVICE_SECRET`, `WORLD_EXECUTION_MODE=convex`, and model
  credentials. `EVE_BUNDLE_PATH` is optional: set it for local dev (import
  straight from the checkout); leave it unset to load the bundle uploaded to
  file storage (required on Convex Cloud). `WORKFLOW_QUEUE_NAMESPACE` /
  `WORLD_CONVEX_DISABLE_PUMP` are derived/pinned automatically by
  `runner/bundle.ts`.
- **Classic mode still exists.** Unset `WORLD_EXECUTION_MODE` and run
  `npx eve dev` in `apps/agent` and the system reverts to eve-as-external-host
  with the world-convex pump delivering jobs over HTTP. Don't run both at
  once — they'd race for the same queue.
- **Auth & BYOK**: the world functions are protected by a shared service
  secret. `chat:send` is public but requires the caller's own key (`apiKey`
  + `provider` args) — a Vercel AI Gateway key or an OpenRouter key. The
  dashboard prompts for it and the runner injects it per session
  (`sessionKeys` table), so visitors spend their own model credits, not the
  deployment's.   Gateway keys are injected as `AI_GATEWAY_API_KEY`;
  OpenRouter keys swap the AI SDK default provider to OpenRouter for that
  session's deliveries (the agent's `anthropic/claude-sonnet-5` model id is
  also a valid OpenRouter slug). One capability difference: gateway-hosted
  provider tools (web_search via parallel_search) are stripped from
  OpenRouter requests — the agent falls back to its `web_fetch` tool.
  Only the hourly heartbeat schedule runs on
  the deployment's own credentials (`AI_GATEWAY_API_KEY` /
  `VERCEL_OIDC_TOKEN`, else `OPENROUTER_API_KEY`). The `ui:*` /
  `notes:list` queries remain public reads — add `ctx.auth` before shipping
  anything real.
- **Payload privacy**: run/step payloads are stored as TypedJSON text and are
  not exposed through the public UI queries; only stream chunks (the agent's
  user-facing output) are readable.
