<script lang="ts">
  import Chat from "./Chat.svelte";
  import NotesPanel from "./NotesPanel.svelte";
  import QueueChips from "./QueueChips.svelte";
  import RunDetail from "./RunDetail.svelte";
  import RunsPanel from "./RunsPanel.svelte";

  let selectedRunId = $state<string | null>(null);
</script>

<div class="dashboard">
  <header class="topbar">
    <a class="brand" href="#/" title="Back to the homepage">
      <span class="logo-mark">▲</span>
      <span class="logo-name">adam</span>
      <span class="slash">/</span>
      <span class="logo-eve">☰ eve</span>
      <span class="x">×</span>
      <span class="logo-convex">convex</span>
      <span class="tagline">durable agents · reactive backend</span>
    </a>
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
</div>

<style>
  .dashboard {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 26px;
    background: rgba(5, 5, 6, 0.72);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13.5px;
    text-decoration: none;
    color: inherit;
  }

  .logo-mark {
    font-size: 11px;
    transform: translateY(-1px);
  }

  .logo-name {
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .slash {
    color: #3c3c44;
  }

  .logo-eve {
    color: #c8c8ce;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .x {
    color: #4a4a52;
    font-size: 11px;
  }

  .logo-convex {
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
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
    padding: 14px 26px 18px;
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
