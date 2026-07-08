<script lang="ts">
  import { setupConvex } from "convex-svelte";
  import { CONVEX_URL } from "./lib/api";
  import Chat from "./lib/components/Chat.svelte";
  import NotesPanel from "./lib/components/NotesPanel.svelte";
  import QueueChips from "./lib/components/QueueChips.svelte";
  import RunDetail from "./lib/components/RunDetail.svelte";
  import RunsPanel from "./lib/components/RunsPanel.svelte";

  setupConvex(CONVEX_URL);

  let selectedRunId = $state<string | null>(null);
</script>

<header class="topbar">
  <div class="brand">
    <span class="mark">eve</span>
    <span class="x">×</span>
    <span class="mark convex">convex</span>
    <span class="tagline">durable agents · reactive backend</span>
  </div>
  <QueueChips />
</header>

<main>
  <Chat />
  <div class="rail">
    <NotesPanel />
    <RunsPanel onSelect={(runId) => (selectedRunId = runId)} />
  </div>
</main>

{#if selectedRunId !== null}
  <RunDetail runId={selectedRunId} onClose={() => (selectedRunId = null)} />
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 22px;
    border-bottom: 1px solid var(--border-soft);
    flex-shrink: 0;
  }

  .brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .mark {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .mark.convex {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .x {
    color: var(--text-faint);
    font-size: 13px;
  }

  .tagline {
    margin-left: 10px;
    color: var(--text-faint);
    font-size: 11.5px;
    letter-spacing: 0.03em;
  }

  main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 14px;
    padding: 14px 22px 18px;
    min-height: 0;
  }

  .rail {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
  }

  @media (max-width: 980px) {
    main {
      grid-template-columns: 1fr;
      overflow-y: auto;
    }

    .rail {
      min-height: 500px;
    }

    .tagline {
      display: none;
    }
  }
</style>
