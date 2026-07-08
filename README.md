# eve on Convex

[eve](https://vercel.com/docs/agents/eve) is Vercel's durable AI agent runtime.
Out of the box it persists its state through the Workflow SDK's "world" —
Postgres + Redis locally, Vercel's managed queues in production.

This repo swaps that world out for **[Convex](https://convex.dev)**. The eve
server is the only non-Convex process; everything durable lives in one Convex
deployment:

- **Workflow state** — runs, steps, events, hooks (event-sourced, transactional)
- **Message queue** — leased jobs with retries, backoff, idempotency, and a
  reactive wake subscription instead of polling
- **Live streams** — agent output chunks written to Convex, tailed reactively
  by the UI
- **App data** — the demo agent's "team notepad" tool writes ordinary Convex
  documents next to the workflow tables
- **The dashboard itself** — a Svelte 5 app served from Convex static hosting,
  subscribed to all of the above over one WebSocket

```
┌────────────────────────┐         ┌──────────────────────────────────┐
│  eve host (Node 24)    │         │  Convex deployment               │
│  apps/agent            │         │  packages/backend                │
│                        │         │                                  │
│  agent loop / models   │  HTTPS  │  world/runs   world/steps        │
│  world-convex ─────────┼────────►│  world/events world/hooks        │
│   · storage            │         │  world/queue  world/streams      │
│   · queue pump ◄───────┼─wake────│  crons (lease reaper)            │
│   · stream writer      │  (WS)   │  notes (app data)                │
│                        │         │  static hosting (the web UI)     │
└───────────▲────────────┘         └───────────────▲──────────────────┘
            │ /eve/v1 chat + HITL                  │ convex-svelte (WS, live)
            │                                      │
        ┌───┴──────────────────────────────────────┴───┐
        │  Svelte 5 dashboard (apps/web)               │
        │  chat · notepad · runs · steps · streams     │
        └──────────────────────────────────────────────┘
```

## Repo layout

| Path | What it is |
| --- | --- |
| `packages/backend` | Convex deployment: schema, `world/*` functions (runs, steps, events, hooks, queue, streams), crons, `notes` app table, static hosting routes, public `ui` queries |
| `packages/world-convex` | Implementation of `@workflow/world` (Storage + Queue + Streamer) backed by the Convex deployment. Loaded by eve via `experimental.workflow.world` |
| `apps/agent` | The eve project: agent definition, Convex-backed tools (`save_note`, `list_notes`, `clear_notes` w/ HITL approval, `workflow_stats`), heartbeat schedule |
| `apps/web` | Svelte 5 + convex-svelte dashboard: chat with the agent (streaming + HITL), live notepad, run/step/event/stream observability |

## Quickstart

Prereqs: **Node 24+** (eve requires it), **pnpm 10**.

```bash
pnpm install
```

**1. Start Convex** (terminal 1):

```bash
cd packages/backend
npx convex dev          # local deployment at http://127.0.0.1:3210
```

**2. Set the world secret** (once, terminal 2):

```bash
cd packages/backend
npx convex env set WORLD_SERVICE_SECRET dev-world-secret
```

**3. Start eve** (terminal 2):

```bash
cd apps/agent
cp .env.example .env    # defaults point at the local Convex deployment
npx eve link            # easiest model credentials: Vercel AI Gateway OIDC
                        # (or set AI_GATEWAY_API_KEY in .env instead)
npx eve dev             # serves http://127.0.0.1:2000
```

**4. Start the dashboard** (terminal 3):

```bash
cd apps/web
pnpm dev                # http://localhost:5173 (proxies /eve → :2000)
```

Open http://localhost:5173 and try:

- *"Save a note: eve is running on Convex end to end"* — watch the notepad
  panel update the instant the tool's mutation commits.
- *"Clear the notepad"* — the `clear_notes` tool requires approval; the HITL
  card in the chat is answered via eve, and the approval round-trips through
  the Convex-backed hook + queue.
- Click any run in the right rail to watch steps, the event log, and the live
  output stream — all Convex reactive queries over the world tables.

## How world-convex works

**Storage** — every Workflow SDK event (`run_created`, `step_completed`,
`hook_received`, …) is applied by a single Convex mutation
(`world/events:create`) that appends the event **and** materializes the
run/step/hook row in the same transaction. ULID event ids give a total order;
payloads (input/output/errors) are opaque TypedJSON so `Uint8Array` and
`Date` survive the trip.

**Queue** — `queue:push` enqueues a job with a `jobKey` for idempotency.
The eve host runs a pump that subscribes to `queue:wake` (a reactive query
returning the next `runAfter`), claims batches with short leases, delivers
them to eve's local workflow endpoints over HTTP, then completes / reschedules
/ releases. A Convex cron reaps expired leases and dead-letters jobs that
exhaust their attempts; `maxDeliveries` is bumped only on real deliveries.

**Streams** — stream writes buffer ~25 ms then flush ordered chunks
(`seq`-numbered) into `streamChunks`. Readers either page through Convex
directly or, in the dashboard, subscribe to `ui:streamText` for a live tail.

**Errors** — the backend throws structured `ConvexError`s
(`{ worldError: { code, ... } }`) which the client maps back to typed
`@workflow/errors` classes, so eve's retry/conflict semantics are preserved.

## Deploying

**Convex backend**

```bash
cd packages/backend
npx convex deploy
npx convex env set WORLD_SERVICE_SECRET <strong-random-value> --prod
```

**Dashboard on Convex static hosting**

```bash
# from the repo root — builds apps/web and uploads dist/ via the backend
VITE_CONVEX_URL=https://<name>.convex.cloud \
VITE_EVE_HOST=https://<your-eve-host> \
pnpm deploy:web
```

The site is served from your deployment's HTTP Actions URL
(`https://<name>.convex.site`), SPA-fallback included.

**eve host** — anywhere Node 24 runs (Vercel, a VM, a container):

```bash
cd apps/agent
npx eve build
CONVEX_URL=https://<name>.convex.cloud \
WORLD_SERVICE_SECRET=<same-value> \
WORKFLOW_LOCAL_BASE_URL=http://127.0.0.1:3000 \
npx eve start
```

## Tests

`packages/world-convex/test/world.e2e.test.ts` runs the full world contract
against a live local deployment: TypedJSON round-trips, event materialization,
queue lease/retry/idempotency/dead-letter, hook conflicts, and live stream
reads.

```bash
cd packages/backend && npx convex dev   # must be running
cd packages/world-convex && pnpm test
```

Stop `eve dev` while the suite runs — its queue pump shares the deployment's
queue and will race the test harness for deliveries.

`pnpm typecheck` / `pnpm build` fan out through turbo.

## Design notes & limits

- **The eve process itself can't run on Convex** — it's a long-lived Node
  server (model streaming, sandboxes, sessions). Convex functions are
  short-lived transactions. This repo moves every durable concern into Convex
  and leaves compute where it has to be.
- **The queue pump lives in the eve host** (world-convex), not in Convex.
  Convex crons handle lease expiry and dead-lettering, so a crashed host never
  strands jobs — a restarted host picks them right back up.
- **Auth**: the world functions are protected by a shared service secret.
  The `ui:*` / `notes:list` queries are public reads for demo purposes — add
  `ctx.auth` before shipping anything real.
- **Payload privacy**: run/step payloads are stored as TypedJSON text and are
  not exposed through the public UI queries; only stream chunks (the agent's
  user-facing output) are readable.
