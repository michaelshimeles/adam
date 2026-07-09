<script lang="ts">
  import { gatewayKey } from "../apiKey.svelte";
  import ApiKeyDialog from "./ApiKeyDialog.svelte";
  import Chat from "./Chat.svelte";
  import NotesPanel from "./NotesPanel.svelte";
  import QueueChips from "./QueueChips.svelte";
  import RunDetail from "./RunDetail.svelte";
  import RunsPanel from "./RunsPanel.svelte";

  let selectedRunId = $state<string | null>(null);
  let keyDialogOpen = $state(false);

  // BYOK gate: no gateway key yet → the dialog blocks the dashboard.
  const keyRequired = $derived(gatewayKey.value === null);
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
    <div class="topbar-right">
      <QueueChips />
      <button
        class="key-chip"
        title="Your AI Gateway key — chats spend your own credits"
        onclick={() => (keyDialogOpen = true)}
      >
        <span class="k">key</span>
        <span class="v">{gatewayKey.hint ? `…${gatewayKey.hint}` : "none"}</span>
      </button>
    </div>
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

  {#if keyRequired || keyDialogOpen}
    <ApiKeyDialog
      required={keyRequired}
      onClose={() => (keyDialogOpen = false)}
    />
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
    min-height: var(--nav-h);
    padding: 0 26px;
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

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .key-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 12px;
    border-radius: 999px;
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 11.5px;
    color: inherit;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .key-chip:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  .key-chip .k {
    color: var(--text-faint);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 600;
  }

  .key-chip .v {
    color: var(--text);
    font-family: var(--mono);
    font-weight: 700;
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

    /* Stacked layout scrolls; give each panel a real height. */
    main > :global(.chat) {
      flex: none;
      height: calc(100dvh - var(--nav-h) - 32px);
      min-height: 420px;
    }

    .rail {
      min-height: 500px;
    }

    .tagline {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .topbar {
      padding: 0 14px;
      gap: 10px;
    }

    /* Keep the brand to "▲ adam" so the chips fit. */
    .slash,
    .logo-eve,
    .x,
    .logo-convex {
      display: none;
    }

    .topbar-right {
      flex-wrap: wrap;
      justify-content: flex-end;
      row-gap: 4px;
      min-width: 0;
    }

    main {
      padding: 10px 12px 14px;
      gap: 12px;
    }
  }
</style>
