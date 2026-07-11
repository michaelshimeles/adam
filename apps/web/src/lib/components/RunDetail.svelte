<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { clock, duration, shortId, timeAgo, workflowLabel } from "../format";
  import { getNow } from "../now.svelte";
  import StatusPill from "./StatusPill.svelte";
  import { Button } from "ui/components/button";

  let { runId, onClose }: { runId: string; onClose: () => void } = $props();

  const run = useQuery(api.getRun, () => ({ runId }));
  const steps = useQuery(api.listSteps, () => ({ runId }));
  const events = useQuery(api.listEvents, () => ({ runId }));
  const streams = useQuery(api.listRunStreams, () => ({ runId }));

  // First stream is auto-selected; clicking a tab overrides it.
  let manualStream = $state<string | null>(null);
  const selectedStream = $derived(
    manualStream ?? streams.data?.[0]?.name ?? null,
  );

  const streamTail = useQuery(api.streamText, () =>
    selectedStream === null
      ? "skip"
      : { runId, name: selectedStream, startSeq: 0 },
  );

  // Attachment: re-runs whenever the stream text grows, following the tail.
  function followTail(node: HTMLElement) {
    void streamTail.data?.text;
    node.scrollTop = node.scrollHeight;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
  onclick={onClose}
  role="presentation"
></div>

<aside
  class="shadow-modal fixed top-0 right-0 bottom-0 z-50 flex w-[min(560px,94vw)] flex-col border-l bg-background max-sm:w-screen max-sm:border-l-0"
  aria-label="Run detail"
>
  <header class="flex items-center justify-between gap-3 border-b px-4 pt-4 pb-3">
    <div class="flex min-w-0 items-center gap-2.5">
      {#if run.data}
        <StatusPill status={run.data.status} />
        <h2
          class="m-0 truncate text-sm font-semibold tracking-[-0.28px]"
          title={run.data.workflowName}
        >
          {workflowLabel(run.data.workflowName)}
        </h2>
      {:else}
        <h2 class="m-0 text-sm font-semibold tracking-[-0.28px]">Run</h2>
      {/if}
    </div>
    <Button
      variant="ghost"
      size="xs"
      class="shrink-0 text-muted-foreground"
      onclick={onClose}
      aria-label="Close"
    >
      ✕
    </Button>
  </header>

  {#if run.data}
    <div class="flex flex-wrap gap-x-6 gap-y-2.5 border-b px-4 py-3">
      <div class="flex flex-col gap-px">
        <span class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase">
          run id
        </span>
        <span class="font-mono text-xs text-foreground" title={runId}>{shortId(runId)}</span>
      </div>
      <div class="flex flex-col gap-px">
        <span class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase">
          created
        </span>
        <span class="text-xs text-foreground">{timeAgo(run.data.createdAt, getNow())}</span>
      </div>
      <div class="flex flex-col gap-px">
        <span class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase">
          duration
        </span>
        <span class="text-xs text-foreground">
          {duration(run.data.startedAt, run.data.completedAt)}
        </span>
      </div>
      {#if run.data.errorCode}
        <div class="flex flex-col gap-px">
          <span class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase">
            error
          </span>
          <span class="font-mono text-xs text-red-900">{run.data.errorCode}</span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex flex-col gap-6 overflow-y-auto px-4 pt-4 pb-7">
    <section>
      <h3
        class="m-0 mb-2.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
      >
        Live Output Stream
      </h3>
      {#if streams.data && streams.data.length > 0}
        <div class="mb-2 flex flex-wrap gap-1.5">
          {#each streams.data as s (s.name)}
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-150 {selectedStream ===
              s.name
                ? 'border-alpha-600 bg-gray-200 text-foreground'
                : 'bg-gray-100 text-muted-foreground hover:border-alpha-500'}"
              onclick={() => (manualStream = s.name)}
            >
              {s.name.length > 22 ? `${s.name.slice(0, 22)}…` : s.name}
              <span class="text-[10px] text-gray-600">{s.dataCount}</span>
              {#if !s.done}
                <span class="size-1.5 animate-pulse rounded-full bg-green-900"></span>
              {/if}
            </button>
          {/each}
        </div>
        {#if streamTail.data}
          <pre
            class="m-0 max-h-64 overflow-y-auto rounded-md border bg-gray-100/50 px-3.5 py-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-gray-900"
            {@attach followTail}>{streamTail.data.text || "(no data yet)"}</pre>
          <div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-600">
            {#if streamTail.data.done}
              stream closed · {streamTail.data.nextSeq} chunks
            {:else}
              <span class="size-1.5 animate-pulse rounded-full bg-green-900"></span>
              streaming · {streamTail.data.nextSeq} chunks
            {/if}
          </div>
        {:else}
          <div class="px-0.5 py-2 text-xs leading-5 text-muted-foreground">Loading stream…</div>
        {/if}
      {:else}
        <div class="px-0.5 py-2 text-xs leading-5 text-muted-foreground">
          No streams on this run. Agent session runs stream their model output
          here token by token — sourced live from the
          <code class="rounded-sm border bg-gray-100 px-1 py-px font-mono text-[11px] text-foreground"
            >streamChunks</code
          > table.
        </div>
      {/if}
    </section>

    <section>
      <h3
        class="m-0 mb-2.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
      >
        Steps
      </h3>
      {#if steps.data && steps.data.length > 0}
        <ul class="m-0 flex list-none flex-col divide-y overflow-hidden rounded-md border p-0">
          {#each steps.data as step (step.stepId)}
            <li class="flex min-w-0 items-center gap-2.5 px-3 py-2">
              <StatusPill status={step.status} />
              <span class="min-w-0 flex-1 truncate font-mono text-xs" title={step.stepName}>
                {step.stepName.replace(/^step\/\//, "")}
              </span>
              <span class="font-mono text-[11px] whitespace-nowrap text-gray-600">
                {#if step.attempt > 1}retry ×{step.attempt} ·{/if}
                {duration(step.startedAt, step.completedAt)}
              </span>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="px-0.5 py-2 text-xs text-muted-foreground">No steps recorded.</div>
      {/if}
    </section>

    <section>
      <h3
        class="m-0 mb-2.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
      >
        Event Log
      </h3>
      {#if events.data && events.data.length > 0}
        <ul class="m-0 flex max-h-72 list-none flex-col gap-1.5 overflow-y-auto p-0">
          {#each events.data as ev (ev.eventId)}
            <li class="flex items-baseline gap-3 px-0.5 py-px text-xs">
              <span class="shrink-0 font-mono text-[11px] text-gray-600">
                {clock(ev.createdAt)}
              </span>
              <span class="text-muted-foreground">{ev.eventType}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="px-0.5 py-2 text-xs text-muted-foreground">No events.</div>
      {/if}
    </section>
  </div>
</aside>
