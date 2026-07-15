<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { Button } from "ui/components/button";

  const health = useQuery(api.queueHealth, {});
  const runs = useQuery(api.listRuns, { limit: 100 });

  const completedRuns = $derived(
    runs.data ? runs.data.filter((r) => r.status === "completed").length : null,
  );

  const command = "git clone github.com/michaelshimeles/adam";

  let copied = $state(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      copied = true;
      setTimeout(() => (copied = false), 1400);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  // The hero console: real telemetry from the deployment serving this page.
  const consoleRows = $derived([
    {
      key: "queue",
      value: health.data ? `${health.data.pending} pending` : null,
    },
    {
      key: "in flight",
      value: health.data ? String(health.data.claimed) : null,
    },
    {
      key: "dead letter",
      value: health.data ? String(health.data.dead) : null,
      alert: (health.data?.dead ?? 0) > 0,
    },
    {
      key: "runs completed",
      value: completedRuns === null ? null : String(completedRuns),
    },
    { key: "runtime", value: "convex node action" },
    { key: "server", value: "none", good: true },
  ]);

  const steps = [
    {
      n: "01",
      name: "compile",
      body: "eve build emits one self-contained bundle: agent loop, tools, Workflow runtime, world-convex. It gets vendored into the Convex deployment. The Nitro server is left on the floor.",
    },
    {
      n: "02",
      name: "execute",
      body: "eve's engine is stateless request/response under the hood. A “use node” action imports the bundle and calls the workflow handler in-process — no HTTP, no host.",
    },
    {
      n: "03",
      name: "deliver",
      body: "Queue mutations schedule a runner tick with ctx.scheduler.runAfter the moment a job becomes due. No polling, no pump. Crons sweep leases as a safety net.",
    },
    {
      n: "04",
      name: "chat",
      body: "chat:send invokes the bundled channel API the way eve's HTTP server would have, then delivers the turn in-process on the same warm action — scheduled ticks stay as the recovery path. Transcripts are durable streams, decoded server-side into a plain reactive query.",
    },
    {
      n: "05",
      name: "schedule",
      body: "The agent's markdown schedules map to Convex crons. The hourly heartbeat starts real sessions that run through the same queue as everything else.",
    },
  ];

  const ledger = [
    {
      title: "Event-sourced runs",
      tag: "world/runs · steps · events · hooks",
      body: "Every workflow event lands in one transactional mutation that appends and materializes state together. Crash anywhere; replay deterministically.",
    },
    {
      title: "Scheduler-driven queue",
      tag: "queueJobs + ctx.scheduler",
      body: "Leased jobs with retries, backoff, idempotency keys and dead-lettering — woken by the Convex scheduler instead of a polling worker.",
    },
    {
      title: "Live token streams",
      tag: "streamChunks · ui:sessionEvents",
      body: "Model output flushes into ordered chunks; the binary framing is decoded in a Convex query, so the UI just subscribes.",
    },
    {
      title: "Human-in-the-loop",
      tag: "hooks · chat:send",
      body: "Tool approvals suspend the workflow on a durable hook. Answering from the UI resumes it — the round-trip never leaves Convex.",
    },
    {
      title: "Schedules as crons",
      tag: "heartbeat.md → crons.ts",
      body: "eve's croner never boots; deployment crons dispatch the same schedule tasks against the bundled runtime.",
    },
    {
      title: "UI from static hosting",
      tag: "convex.site",
      body: "This page and the dashboard are served by the deployment they describe, subscribed over one WebSocket.",
    },
  ];

  const diff = [
    ["Nitro HTTP server", "in-process function calls"],
    ["queue pump", "ctx.scheduler.runAfter"],
    ["SSE transport", "reactive Convex queries"],
    ["Postgres + Redis", "one Convex deployment"],
  ];
</script>

{#snippet sectionHead(eyebrow: string, title: string, sub?: string)}
  <div class="mb-10">
    <p class="m-0 mb-2 font-mono text-[11px] font-medium tracking-[0.12em] text-gray-600 uppercase">
      {eyebrow}
    </p>
    <h3 class="m-0 text-2xl leading-8 font-semibold tracking-[-0.96px] text-gray-1000">
      {title}
    </h3>
    {#if sub}
      <p class="mt-2 mb-0 max-w-[560px] text-sm leading-5 text-muted-foreground">{sub}</p>
    {/if}
  </div>
{/snippet}

<div class="min-h-0 flex-1 scroll-smooth overflow-y-auto bg-background text-foreground">
  <!-- nav -->
  <nav
    class="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b bg-background/70 px-4 backdrop-blur-md md:px-6"
  >
    <a class="flex items-baseline gap-2.5 no-underline" href="#/">
      <span class="text-sm text-foreground">▲</span>
      <span class="text-sm font-semibold tracking-[-0.28px] text-foreground">adam</span>
      <span class="hidden font-mono text-xs text-gray-600 sm:inline">eve × convex</span>
    </a>
    <div class="flex items-center gap-1 md:gap-2">
      <a
        class="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-alpha-100 hover:text-foreground md:inline-block"
        href="#how">How It Works</a
      >
      <a
        class="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-alpha-100 hover:text-foreground md:inline-block"
        href="#arch">Architecture</a
      >
      <a
        class="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-alpha-100 hover:text-foreground"
        href="https://github.com/michaelshimeles/adam/fork"
        target="_blank"
        rel="noreferrer"
        aria-label="Fork adam on GitHub"
      >
        <span>fork it</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path
            d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"
          />
        </svg>
      </a>
      <Button href="#/dashboard" size="sm">Open Dashboard</Button>
    </div>
  </nav>

  <!-- hero: claim on the left, the live deployment proving it on the right -->
  <section class="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pt-20 pb-24 md:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:pt-28">
    <div class="min-w-0">
      <p class="m-0 mb-4 font-mono text-[11px] font-medium tracking-[0.14em] text-gray-600 uppercase">
        eve × convex — a port, not a wrapper
      </p>
      <h1
        class="m-0 text-[40px] leading-[48px] font-semibold tracking-[-2.4px] text-balance text-gray-1000 lg:text-[56px] lg:leading-[56px] lg:tracking-[-3.36px]"
      >
        The durable agent runtime, all on Convex
      </h1>
      <p class="mt-6 mb-0 max-w-[520px] text-base leading-6 text-muted-foreground">
        adam takes
        <a
          class="text-foreground underline decoration-alpha-500 underline-offset-4 hover:decoration-alpha-800"
          href="https://eve.dev"
          target="_blank"
          rel="noreferrer">eve</a
        >
        — Vercel's agent framework — and executes its entire engine inside Convex. One deployment
        is the database, the queue, the scheduler, and the runtime.
      </p>

      <div class="mt-8 flex flex-wrap items-center gap-3">
        <Button href="#/dashboard" size="lg">Open Dashboard</Button>
        <Button
          href="https://github.com/michaelshimeles/adam"
          target="_blank"
          rel="noreferrer"
          variant="outline"
          size="lg"
        >
          Read the Code ↗
        </Button>
      </div>

      <button
        class="mt-8 inline-flex max-w-full cursor-pointer items-center gap-2.5 rounded-md border bg-transparent px-3 py-2 font-mono text-[13px] text-muted-foreground transition-colors duration-150 hover:border-alpha-500 hover:text-foreground"
        onclick={copyCommand}
        title="Copy to clipboard"
      >
        <span class="text-gray-600">$</span>
        <span class="min-w-0 text-left break-all">{command}</span>
        <span class="min-w-12 text-right text-[11px] text-gray-600">
          {copied ? "copied" : "copy"}
        </span>
      </button>
      <p class="mt-2 mb-0 font-mono text-[11px] text-gray-600">
        that's the whole runtime — there is no step two
      </p>
    </div>

    <!-- the signature: live telemetry from the deployment serving this page -->
    <aside
      class="shadow-menu w-full min-w-0 rounded-xl border bg-background"
      aria-label="Live deployment status"
    >
      <div class="flex items-center justify-between gap-3 border-b px-4 py-3">
        <span class="truncate font-mono text-xs text-gray-600">adam@convex — deployment</span>
        {#if health.data}
          <span class="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-green-900">
            <span class="size-1.5 animate-pulse rounded-full bg-current"></span> live
          </span>
        {:else if health.error}
          <span class="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-red-900">
            <span class="size-1.5 rounded-full bg-current"></span> offline
          </span>
        {:else}
          <span class="shrink-0 font-mono text-[11px] text-gray-600">connecting…</span>
        {/if}
      </div>
      <dl class="m-0 flex flex-col gap-2.5 px-4 py-4 font-mono text-[13px]">
        {#each consoleRows as row (row.key)}
          <div class="flex items-baseline gap-3">
            <dt class="shrink-0 text-gray-600">{row.key}</dt>
            <dd class="m-0 min-w-0 flex-1 border-b border-dashed border-alpha-300"></dd>
            <dd
              class="m-0 shrink-0 tabular-nums {row.alert
                ? 'text-red-900'
                : row.good
                  ? 'text-green-900'
                  : 'text-gray-1000'}"
            >
              {row.value ?? "…"}
            </dd>
          </div>
        {/each}
        <div class="mt-1.5 flex items-center gap-2 text-gray-600" aria-hidden="true">
          <span>$</span>
          <span class="animate-pulse text-gray-1000">▌</span>
        </div>
      </dl>
      <p class="m-0 border-t px-4 py-2.5 text-[11px] leading-4 text-gray-600">
        Real numbers — this page subscribes to the deployment it describes.
      </p>
    </aside>
  </section>

  <!-- statement -->
  <section class="border-t">
    <div class="mx-auto max-w-[820px] px-4 py-24 text-center md:px-6">
      <h2 class="m-0 text-[32px] leading-10 font-semibold tracking-[-1.28px] text-balance text-gray-1000">
        Your
        <span
          class="mx-1 inline-block -translate-y-0.5 rounded-md border bg-gray-100 px-3 pb-0.5 font-mono text-[0.8em] text-gray-1000"
          >convex/</span
        >
        is the runtime
      </h2>
      <p class="mx-auto mt-5 mb-0 max-w-[620px] text-base leading-7 text-muted-foreground">
        eve says an agent is a directory — an
        <code class="rounded-sm border bg-gray-100 px-1.5 py-px font-mono text-[0.9em] text-gray-1000"
          >instructions.md</code
        >, some tools, a schedule. adam keeps that, then uses
        <code class="rounded-sm border bg-gray-100 px-1.5 py-px font-mono text-[0.9em] text-gray-1000"
          >eve build</code
        >
        as a compiler instead of a server: the emitted bundle is vendored into the deployment and
        every turn executes inside a Convex action. Durability between invocations is exactly the
        world state in Convex tables.
      </p>
    </div>
  </section>

  <!-- pipeline: an actual sequence, rendered as one -->
  <section class="border-t" id="how">
    <div class="mx-auto max-w-[820px] scroll-mt-20 px-4 py-24 md:px-6">
      {@render sectionHead(
        "the pipeline",
        "How a message becomes a durable run",
        "The eve HTTP server is gone; its protocol survives in-process.",
      )}
      <ol class="m-0 flex list-none flex-col p-0">
        {#each steps as step, i (step.n)}
          <li class="grid grid-cols-[40px_minmax(0,1fr)] gap-x-5 md:gap-x-8">
            <div class="flex flex-col items-center">
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-md border bg-gray-100 font-mono text-xs text-gray-900"
              >
                {step.n}
              </span>
              {#if i < steps.length - 1}
                <span class="w-px flex-1 bg-border" aria-hidden="true"></span>
              {/if}
            </div>
            <div class="pt-2 {i < steps.length - 1 ? 'pb-10' : ''}">
              <h4 class="m-0 font-mono text-[13px] font-semibold tracking-[0.06em] text-gray-1000 uppercase">
                {step.name}
              </h4>
              <p class="mt-2 mb-0 max-w-[560px] text-sm leading-5 text-muted-foreground">
                {step.body}
              </p>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <!-- ledger: the durable pieces, as a spec sheet -->
  <section class="border-t">
    <div class="mx-auto max-w-[980px] px-4 py-24 md:px-6">
      {@render sectionHead(
        "the machinery",
        "Everything durable, one deployment",
        "The pieces eve normally spreads across a host, Postgres and Redis.",
      )}
      <div class="border-t">
        {#each ledger as item (item.title)}
          <div class="grid gap-x-10 gap-y-1.5 border-b py-5 md:grid-cols-[280px_minmax(0,1fr)]">
            <div class="min-w-0">
              <h4 class="m-0 text-sm leading-5 font-semibold tracking-[-0.28px] text-gray-1000">
                {item.title}
              </h4>
              <code class="mt-1 block font-mono text-[11px] leading-4 break-words text-gray-600">
                {item.tag}
              </code>
            </div>
            <p class="m-0 max-w-[560px] self-center text-sm leading-5 text-muted-foreground">
              {item.body}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- the diff: what the port deleted -->
  <section class="border-t">
    <div class="mx-auto max-w-[820px] px-4 py-24 md:px-6">
      {@render sectionHead(
        "the port",
        "What's genuinely gone",
        "Not proxied, not emulated behind a shim — deleted, with a Convex primitive in its place.",
      )}
      <div class="overflow-hidden rounded-lg border">
        <div class="flex items-center justify-between border-b bg-gray-100 px-4 py-2">
          <span class="font-mono text-[11px] text-gray-600">infra.diff</span>
          <span class="font-mono text-[11px]">
            <span class="text-red-900">−{diff.length}</span>
            <span class="text-green-900">+{diff.length}</span>
          </span>
        </div>
        <div class="flex flex-col py-2 font-mono text-[13px] leading-6">
          {#each diff as [gone, instead] (gone)}
            <div class="flex gap-3 bg-red-100/40 px-4">
              <span class="select-none text-red-900" aria-hidden="true">-</span>
              <span class="text-red-900">{gone}</span>
            </div>
            <div class="flex gap-3 bg-green-100/40 px-4">
              <span class="select-none text-green-900" aria-hidden="true">+</span>
              <span class="text-green-900">{instead}</span>
            </div>
          {/each}
        </div>
      </div>
      <p class="mt-4 mb-0 text-sm leading-5 text-muted-foreground">
        What remains from Vercel:
        <code class="rounded-sm border bg-gray-100 px-1.5 py-px font-mono text-xs text-gray-1000"
          >eve build</code
        >
        as a compile step, and the AI&nbsp;Gateway for model credentials — or
        bring an OpenRouter key instead.
      </p>
    </div>
  </section>

  <!-- architecture -->
  <section class="border-t" id="arch">
    <div class="mx-auto max-w-[980px] scroll-mt-20 px-4 py-24 md:px-6">
      {@render sectionHead(
        "the deployment",
        "Architecture",
        "How a chat message flows through the deployment and back to this page.",
      )}

      <div class="mx-auto max-w-[760px]">
        <div class="rounded-xl border bg-background p-5">
          <div class="mb-4 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Convex deployment · packages/backend
          </div>

          <div class="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr] md:gap-3">
            <div class="flex min-w-0 flex-col gap-1 rounded-md border bg-gray-100 px-3.5 py-2.5">
              <span class="font-mono text-[13px] font-medium break-words text-gray-1000">chat:send</span>
              <span class="font-mono text-[11px] break-words text-gray-600">action · "use node"</span>
            </div>
            <span class="text-center font-mono text-sm text-gray-600" aria-hidden="true">
              <span class="hidden md:inline">⟶</span><span class="md:hidden">↓</span>
            </span>
            <div class="flex min-w-0 flex-col gap-1 rounded-md border bg-gray-100 px-3.5 py-2.5">
              <span class="font-mono text-[13px] font-medium break-words text-gray-1000">eve channel API</span>
              <span class="font-mono text-[11px] break-words text-gray-600">bundled · in-process</span>
            </div>
          </div>

          <div class="flex items-center justify-center gap-2 py-3" aria-hidden="true">
            <span class="font-mono text-sm text-gray-600">↓</span>
            <span class="font-mono text-[11px] text-gray-600">
              enqueue · then delivered inline on the same action — ticks recover
            </span>
          </div>

          <div class="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr] md:gap-3">
            <div class="flex min-w-0 flex-col gap-1 rounded-md border bg-gray-100 px-3.5 py-2.5">
              <span class="font-mono text-[13px] font-medium break-words text-gray-1000">world/queue</span>
              <span class="font-mono text-[11px] break-words text-gray-600">mutations</span>
            </div>
            <span
              class="flex flex-col items-center gap-0.5 text-center font-mono text-gray-600"
              aria-hidden="true"
            >
              <span class="text-[11px]">ctx.scheduler</span>
              <span class="hidden text-sm md:inline">⟶</span><span class="text-sm md:hidden">↓</span>
            </span>
            <div class="flex min-w-0 flex-col gap-1 rounded-md border bg-gray-100 px-3.5 py-2.5">
              <span class="font-mono text-[13px] font-medium break-words text-gray-1000">runner/engine:tick</span>
              <span class="font-mono text-[11px] break-words text-gray-600">action · "use node"</span>
            </div>
          </div>

          <div class="flex items-center justify-center gap-2 py-3" aria-hidden="true">
            <span class="font-mono text-sm text-gray-600">↓</span>
            <span class="font-mono text-[11px] text-gray-600">imports the vendored eve bundle</span>
          </div>

          <div class="mx-auto flex w-fit flex-col items-center gap-1 rounded-md border bg-gray-100 px-6 py-2.5 text-center">
            <span class="font-mono text-[13px] font-medium text-gray-1000">workflow POST handler</span>
            <span class="font-mono text-[11px] text-gray-600">agent loop · models · tools</span>
          </div>

          <div class="flex items-center justify-center gap-2 py-3" aria-hidden="true">
            <span class="font-mono text-sm text-gray-600">↓</span>
            <span class="font-mono text-[11px] text-gray-600">durable writes</span>
          </div>

          <div class="flex flex-col gap-1.5 rounded-md border bg-gray-100 px-3.5 py-3">
            <div class="flex flex-wrap gap-1.5">
              <code class="rounded-sm border bg-gray-200 px-2 py-0.5 font-mono text-[11px] text-gray-1000">world/runs</code>
              <code class="rounded-sm border bg-gray-200 px-2 py-0.5 font-mono text-[11px] text-gray-1000">steps</code>
              <code class="rounded-sm border bg-gray-200 px-2 py-0.5 font-mono text-[11px] text-gray-1000">events</code>
              <code class="rounded-sm border bg-gray-200 px-2 py-0.5 font-mono text-[11px] text-gray-1000">hooks</code>
              <code class="rounded-sm border bg-gray-200 px-2 py-0.5 font-mono text-[11px] text-gray-1000">streams</code>
            </div>
            <span class="font-mono text-[11px] text-gray-600">
              crons: lease reaper · sweep · heartbeat schedule
            </span>
            <span class="font-mono text-[11px] text-gray-600">
              notes (app data) · static hosting (this page)
            </span>
          </div>
        </div>

        <div class="flex flex-col items-center gap-1.5 py-3" aria-hidden="true">
          <span class="h-5 w-px bg-green-500"></span>
          <span
            class="inline-flex items-center gap-2 rounded-full border border-green-400 bg-green-100 px-3 py-1 font-mono text-[11px] text-green-900"
          >
            <span class="size-1.5 animate-pulse rounded-full bg-current"></span>
            convex-svelte · one WebSocket · all live
          </span>
          <span class="h-5 w-px bg-green-500"></span>
        </div>

        <div class="mx-auto flex w-fit flex-col items-center gap-1 rounded-md border bg-gray-100 px-6 py-3 text-center">
          <span class="font-mono text-[13px] font-medium text-gray-1000">
            Svelte 5 dashboard — this site
          </span>
          <span class="font-mono text-[11px] text-gray-600">
            chat + HITL · notepad · runs / steps / streams
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- cta -->
  <section class="border-t">
    <div class="mx-auto max-w-[820px] px-4 py-24 text-center md:px-6">
      <h3 class="m-0 text-[32px] leading-10 font-semibold tracking-[-1.28px] text-gray-1000">
        Talk to it
      </h3>
      <p class="mx-auto mt-3 mb-8 max-w-[520px] text-base leading-6 text-muted-foreground">
        Ask it what time it is, save a note, check queue health, or clear the notepad and
        watch a human-in-the-loop approval suspend and resume a workflow.
      </p>
      <div class="mx-auto flex max-w-80 flex-col justify-center gap-3 md:max-w-none md:flex-row">
        <Button href="#/dashboard" size="lg">Open Dashboard</Button>
        <Button
          href="https://github.com/michaelshimeles/adam"
          target="_blank"
          rel="noreferrer"
          variant="outline"
          size="lg"
        >
          Read the Code ↗
        </Button>
      </div>
    </div>
  </section>

  <!-- footer -->
  <footer
    class="flex flex-wrap items-center justify-center gap-2.5 border-t px-5 pt-7 pb-10 text-center font-mono text-[11px] text-gray-600"
  >
    <span>eve 0.22 · convex · svelte 5</span>
    <span class="text-gray-500">—</span>
    <span>the whole thing, ported</span>
  </footer>
</div>
