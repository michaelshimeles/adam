<script lang="ts">
  import { gatewayKey } from "../apiKey.svelte";
  import { AGENT_MODEL, BRAND_NAME, IS_AGENT_APP, WEBHOOK_ENABLED } from "../brand";
  import ApiKeyDialog from "./ApiKeyDialog.svelte";
  import Chat from "./Chat.svelte";
  import NotesPanel from "./NotesPanel.svelte";
  import QueueChips from "./QueueChips.svelte";
  import RunDetail from "./RunDetail.svelte";
  import RunsPanel from "./RunsPanel.svelte";
  import WebhookPanel from "./WebhookPanel.svelte";

  let selectedRunId = $state<string | null>(null);
  let keyDialogOpen = $state(false);

  // BYOK gate: no gateway key yet → the dialog blocks the dashboard.
  const keyRequired = $derived(gatewayKey.value === null);
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <header
    class="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/70 px-3.5 backdrop-blur-md md:px-6"
  >
    <a
      class="flex items-baseline gap-2.5 text-sm text-foreground no-underline"
      href="#/"
      title={IS_AGENT_APP ? BRAND_NAME : "Back to the homepage"}
    >
      <span>▲</span>
      <span class="font-semibold tracking-[-0.28px]">{BRAND_NAME}</span>
      <span class="hidden font-mono text-xs text-gray-600 sm:inline">
        {IS_AGENT_APP && AGENT_MODEL ? AGENT_MODEL : "eve × convex"}
      </span>
    </a>
    <div class="flex min-w-0 flex-wrap items-center justify-end gap-2 gap-y-1">
      <QueueChips />
      <button
        class="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100"
        title="Your AI Gateway key — chats spend your own credits"
        onclick={() => (keyDialogOpen = true)}
      >
        <span class="text-[10px] font-medium tracking-[0.04em] text-gray-600 uppercase">key</span>
        <span class="font-mono font-medium text-foreground">
          {gatewayKey.hint ? `…${gatewayKey.hint}` : "none"}
        </span>
      </button>
    </div>
  </header>

  <main
    class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-3 md:p-4 lg:grid-cols-[minmax(0,1fr)_368px] lg:overflow-visible lg:px-6 lg:pb-5"
  >
    <Chat />
    <div class="flex min-h-[500px] flex-col gap-4 lg:min-h-0">
      <NotesPanel />
      {#if WEBHOOK_ENABLED}
        <WebhookPanel />
      {/if}
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
  /* Stacked (mobile/tablet) layout scrolls; give the chat a real height. */
  @media (max-width: 960px) {
    main > :global([data-chat]) {
      flex: none;
      height: calc(100dvh - 4rem - 2rem);
      min-height: 420px;
    }
  }
</style>
