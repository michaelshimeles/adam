<script lang="ts">
  import { modelKey } from "../apiKey.svelte";
  import { WEBHOOK_ENABLED } from "../brand";
  import NotesPanel from "./NotesPanel.svelte";
  import QueueChips from "./QueueChips.svelte";
  import RunDetail from "./RunDetail.svelte";
  import RunsPanel from "./RunsPanel.svelte";
  import WebhookPanel from "./WebhookPanel.svelte";

  let { onOpenKeyDialog }: { onOpenKeyDialog: () => void } = $props();

  let selectedRunId = $state<string | null>(null);
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
    <div class="flex flex-col gap-1 border-b pb-4">
      <h2 class="m-0 text-base font-semibold text-foreground">Settings</h2>
      <p class="m-0 text-xs text-muted-foreground">
        Observability and configuration for this agent deployment.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <h3 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
        API key
      </h3>
      <div class="flex items-center justify-between gap-3 rounded-lg border bg-gray-100/40 px-4 py-3">
        <div class="min-w-0">
          <p class="m-0 text-[13px] text-foreground">
            {#if modelKey.hint}
              {modelKey.providerLabel ?? "Model"} key
              <code class="font-mono text-muted-foreground">…{modelKey.hint}</code>
            {:else}
              No key set
            {/if}
          </p>
          <p class="m-0 mt-0.5 text-xs text-muted-foreground">
            Chats spend your own credits — the key stays in this browser.
          </p>
        </div>
        <button
          class="shrink-0 cursor-pointer rounded-md border bg-background px-3 py-1.5 text-xs text-foreground transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100"
          onclick={onOpenKeyDialog}
        >
          {modelKey.hint ? "Change key" : "Add key"}
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h3 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
        Queue health
      </h3>
      <div class="rounded-lg border bg-gray-100/40 px-4 py-3">
        <QueueChips />
      </div>
    </div>

    <div class="flex max-h-[480px] flex-col gap-2">
      <h3 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
        Workflow runs
      </h3>
      <RunsPanel onSelect={(runId) => (selectedRunId = runId)} />
    </div>

    {#if WEBHOOK_ENABLED}
      <div class="flex flex-col gap-2">
        <h3 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
          Webhook channel
        </h3>
        <WebhookPanel />
      </div>
    {/if}

    <div class="flex max-h-[420px] flex-col gap-2">
      <h3 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
        Notepad
      </h3>
      <NotesPanel />
    </div>
  </div>
</section>

{#if selectedRunId !== null}
  <RunDetail runId={selectedRunId} onClose={() => (selectedRunId = null)} />
{/if}
