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
│                                         ▼                        │
│   world/queue ──ctx.scheduler──► runner/engine:tick              │
│   (mutations)                    (action, "use node")            │
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
| `apps/agent` | The eve project: agent definition, Convex-backed tools (`save_note`, `list_notes`, `clear_notes` w/ HITL approval, `workflow_stats`), heartbeat schedule. Built with `eve build`, never started as a server |
| `apps/web` | Svelte 5 + convex-svelte dashboard: chat with the agent (streaming + HITL), live notepad, run/step/event/stream observability |

## How the port works

1. **Compile** — `eve build` (in `apps/agent`) emits a self-contained ESM
   bundle: the agent loop, model calls, tool defs, the Workflow SDK runtime,
   and `world-convex` all in one file. `scripts/vendor-eve.mjs` copies it into
   `packages/backend/eve-runtime/bundle/` (the Nitro HTTP entrypoint is
   deliberately excluded).
2. **Execute** — eve's engine is stateless request/response at its core: flow
   jobs arrive as HTTP `Request`s and return `{ok}` or `{timeoutSeconds}`.
   `convex/runner/engine.ts` (a `"use node"` action) imports the bundle,
   claims jobs from the Convex queue, fabricates those `Request`s, and calls
   the handler in-process. Suspensions become queue reschedules.
3. **Deliver** — the queue mutations (`world/queue.ts`) schedule a runner tick
   via `ctx.scheduler.runAfter(...)` whenever a job becomes due
   (`WORLD_EXECUTION_MODE=convex`). No polling, no pump. Crons requeue expired
   leases and sweep anything a deploy interrupted.
4. **Chat** — `convex/chat.ts` exposes `chat:send`, which invokes the bundled
   channel API (session create / message send / HITL responses) the same way
   the eve HTTP server would have. Session transcripts are world streams;
   `ui:sessionEvents` decodes their binary framing (length-prefixed
   devalue-encoded frames) server-side and returns structured events that the
   dashboard consumes as a plain reactive query.
5. **Schedules** — `agent/schedules/heartbeat.md` is mirrored by a Convex cron
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

# model credentials — either a Vercel AI Gateway key:
npx convex env set AI_GATEWAY_API_KEY <your-key>
# ...or a Vercel OIDC token (expires ~12h; fine for a quick demo):
#   cd apps/agent && npx vercel link && npx vercel env pull
#   npx convex env set VERCEL_OIDC_TOKEN <token from apps/agent/.env>
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

## Deploying

```bash
cd packages/backend
npx convex deploy
# set the same env vars as the quickstart on prod (--prod), with a strong
# WORLD_SERVICE_SECRET and CONVEX_URL=https://<name>.convex.cloud

# dashboard → Convex static hosting, from the repo root:
VITE_CONVEX_URL=https://<name>.convex.cloud pnpm deploy:web
# served at https://<name>.convex.site, SPA-fallback included
```

**Cloud caveat:** the runner currently loads the eve bundle with a dynamic
`import(EVE_BUNDLE_PATH)`. On a **local dev deployment** Node actions run on
your machine, so the vendored path resolves and everything above works. On
**Convex Cloud**, actions run in Convex's environment where that path doesn't
exist — you'd need to ship the bundle differently (publish it as a package and
mark it as a node external, or self-host Convex). This repo demonstrates the
architecture end-to-end against a local deployment.

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

`pnpm typecheck` / `pnpm build` fan out through turbo; `pnpm build` also
re-vendors the eve bundle.

## Design notes & limits

- **eve was built to be a server; here it's a library.** The port works
  because eve's engine is stateless request/response under the hood — every
  flow job is an HTTP request, every suspension a reschedule. The Convex
  runner speaks that protocol in-process. Model streaming happens inside a
  single action invocation (bounded by Convex's action timeout), and
  durability between invocations is exactly the world state in Convex tables.
- **What's genuinely gone:** the Nitro HTTP server, the queue pump, SSE
  transport to the browser, and every non-Convex runtime dependency
  (Postgres/Redis). What remains from Vercel: `eve build` as a compile step
  and the AI Gateway for model credentials.
- **Env vars the runner needs** (see quickstart): `CONVEX_URL`,
  `WORLD_SERVICE_SECRET`, `WORLD_EXECUTION_MODE=convex`, `EVE_BUNDLE_PATH`,
  and model credentials. `WORKFLOW_QUEUE_NAMESPACE` / `WORLD_CONVEX_DISABLE_PUMP`
  are derived/pinned automatically by `runner/bundle.ts`.
- **Classic mode still exists.** Unset `WORLD_EXECUTION_MODE` and run
  `npx eve dev` in `apps/agent` and the system reverts to eve-as-external-host
  with the world-convex pump delivering jobs over HTTP. Don't run both at
  once — they'd race for the same queue.
- **Auth**: the world functions are protected by a shared service secret.
  `chat:send` and the `ui:*` / `notes:list` queries are public for demo
  purposes — add `ctx.auth` before shipping anything real.
- **Payload privacy**: run/step payloads are stored as TypedJSON text and are
  not exposed through the public UI queries; only stream chunks (the agent's
  user-facing output) are readable.
