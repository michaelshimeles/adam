<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { clock, duration, shortId, timeAgo, workflowLabel } from "../format";
  import { getNow } from "../now.svelte";

  let { runId, onClose }: { runId: string; onClose: () => void } = $props();

  const run = useQuery(api.getRun, () => ({ runId }));
  const steps = useQuery(api.listSteps, () => ({ runId }));
  const events = useQuery(api.listEvents, () => ({ runId }));
  const streams = useQuery(api.listRunStreams, () => ({ runId }));

  let selectedStream = $state<string | null>(null);

  // Auto-select the first stream once streams load.
  $effect(() => {
    const list = streams.data;
    if (list && list.length > 0 && selectedStream === null) {
      selectedStream = list[0]!.name;
    }
  });

  const streamTail = useQuery(api.streamText, () =>
    selectedStream === null
      ? "skip"
      : { runId, name: selectedStream, startSeq: 0 },
  );

  let tailEl = $state<HTMLPreElement | null>(null);

  // Follow the live tail as new chunks arrive.
  $effect(() => {
    void streamTail.data?.text;
    if (tailEl) tailEl.scrollTop = tailEl.scrollHeight;
  });

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="backdrop" onclick={onClose} role="presentation"></div>

<aside class="drawer" aria-label="Run detail">
  <header>
    <div class="title">
      {#if run.data}
        <span class="pill {run.data.status}">
          <span class="dot"></span>{run.data.status}
        </span>
        <h2 title={run.data.workflowName}>
          {workflowLabel(run.data.workflowName)}
        </h2>
      {:else}
        <h2>Run</h2>
      {/if}
    </div>
    <button class="close" onclick={onClose} aria-label="Close">✕</button>
  </header>

  {#if run.data}
    <div class="facts">
      <div class="fact">
        <span class="k">run id</span>
        <span class="v mono" title={runId}>{shortId(runId)}</span>
      </div>
      <div class="fact">
        <span class="k">created</span>
        <span class="v">{timeAgo(run.data.createdAt, getNow())}</span>
      </div>
      <div class="fact">
        <span class="k">duration</span>
        <span class="v">
          {duration(run.data.startedAt, run.data.completedAt)}
        </span>
      </div>
      {#if run.data.errorCode}
        <div class="fact">
          <span class="k">error</span>
          <span class="v err">{run.data.errorCode}</span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="body">
    <section>
      <h3>Live output stream</h3>
      {#if streams.data && streams.data.length > 0}
        <div class="stream-tabs">
          {#each streams.data as s (s.name)}
            <button
              class="stream-tab"
              class:active={selectedStream === s.name}
              onclick={() => (selectedStream = s.name)}
            >
              {s.name.length > 22 ? `${s.name.slice(0, 22)}…` : s.name}
              <span class="count">{s.dataCount}</span>
              {#if !s.done}<span class="live-dot"></span>{/if}
            </button>
          {/each}
        </div>
        {#if streamTail.data}
          <pre class="tail" bind:this={tailEl}>{streamTail.data.text || "(no data yet)"}</pre>
          <div class="tail-meta">
            {#if streamTail.data.done}
              stream closed · {streamTail.data.nextSeq} chunks
            {:else}
              <span class="live-dot"></span> streaming · {streamTail.data.nextSeq}
              chunks
            {/if}
          </div>
        {:else}
          <div class="empty">Loading stream…</div>
        {/if}
      {:else}
        <div class="empty">
          No streams on this run. Agent session runs stream their model output
          here token by token — sourced live from the
          <code>streamChunks</code> table.
        </div>
      {/if}
    </section>

    <section>
      <h3>Steps</h3>
      {#if steps.data && steps.data.length > 0}
        <ul class="steps">
          {#each steps.data as step (step.stepId)}
            <li>
              <span class="pill {step.status}">
                <span class="dot"></span>{step.status}
              </span>
              <span class="step-name mono" title={step.stepName}>
                {step.stepName.replace(/^step\/\//, "")}
              </span>
              <span class="step-meta">
                {#if step.attempt > 1}retry ×{step.attempt} ·{/if}
                {duration(step.startedAt, step.completedAt)}
              </span>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="empty">No steps recorded.</div>
      {/if}
    </section>

    <section>
      <h3>Event log</h3>
      {#if events.data && events.data.length > 0}
        <ul class="events">
          {#each events.data as ev (ev.eventId)}
            <li>
              <span class="ev-time mono">{clock(ev.createdAt)}</span>
              <span class="ev-type">{ev.eventType}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="empty">No events.</div>
      {/if}
    </section>
  </div>
</aside>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 5, 8, 0.55);
    backdrop-filter: blur(2px);
    z-index: 40;
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(560px, 94vw);
    background: var(--bg-raise);
    border-left: 1px solid var(--border);
    z-index: 50;
    display: flex;
    flex-direction: column;
    box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--border-soft);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close {
    background: var(--panel-2);
    color: var(--text-dim);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 12px;
    flex-shrink: 0;
  }

  .close:hover {
    color: var(--text);
    border-color: var(--border);
  }

  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border-soft);
  }

  .fact {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .fact .k {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-faint);
    font-weight: 700;
  }

  .fact .v {
    font-size: 12.5px;
    color: var(--text);
  }

  .fact .v.err {
    color: var(--red);
    font-family: var(--mono);
  }

  .mono {
    font-family: var(--mono);
  }

  .body {
    overflow-y: auto;
    padding: 16px 18px 28px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  h3 {
    margin: 0 0 10px;
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .stream-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .stream-tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--panel-2);
    color: var(--text-dim);
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    padding: 4px 11px;
    font-size: 11.5px;
    font-family: var(--mono);
    cursor: pointer;
  }

  .stream-tab.active {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.4);
    background: #17171c;
  }

  .stream-tab .count {
    color: var(--text-faint);
    font-size: 10px;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    display: inline-block;
    animation: pulse 1.6s ease-in-out infinite;
  }

  .tail {
    margin: 0;
    background: #08080a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    font-family: var(--mono);
    font-size: 12px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 260px;
    overflow-y: auto;
    color: #b9b9c2;
  }

  .tail-meta {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 6px;
    font-size: 11px;
    color: var(--text-faint);
  }

  .steps,
  .events {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .steps li {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--panel);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    min-width: 0;
  }

  .step-name {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .step-meta {
    font-size: 11px;
    color: var(--text-faint);
    white-space: nowrap;
  }

  .events {
    max-height: 300px;
    overflow-y: auto;
  }

  .events li {
    display: flex;
    gap: 12px;
    align-items: baseline;
    padding: 3px 2px;
    font-size: 12px;
  }

  .ev-time {
    color: var(--text-faint);
    font-size: 11px;
    flex-shrink: 0;
  }

  .ev-type {
    color: var(--text-dim);
  }

  .empty {
    color: var(--text-faint);
    font-size: 12.5px;
    line-height: 1.5;
    padding: 8px 2px;
  }

  .empty code {
    font-family: var(--mono);
    background: var(--panel-2);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 11px;
  }
</style>
