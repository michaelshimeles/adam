<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { timeAgo, workflowLabel } from "../format";
  import { getNow } from "../now.svelte";
  import StatusPill from "./StatusPill.svelte";

  let { onSelect }: { onSelect: (runId: string) => void } = $props();

  const runs = useQuery(api.listRuns, { limit: 30 });
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
  <header class="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b px-4">
    <h2 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
      Workflow Runs
    </h2>
    <span class="font-mono text-[11px] text-gray-600">durable state</span>
  </header>

  {#if runs.isLoading}
    <div class="px-4 py-5 text-center text-xs text-muted-foreground">Loading…</div>
  {:else if runs.error}
    <div class="px-4 py-5 text-center text-xs text-red-900">Can't reach Convex</div>
  {:else if runs.data.length === 0}
    <div class="px-4 py-5 text-xs leading-5 text-muted-foreground">
      No runs yet. Send the agent a message and its workflow run appears here.
    </div>
  {:else}
    <ul class="m-0 flex min-h-0 list-none flex-col divide-y overflow-y-auto p-0">
      {#each runs.data as run (run.runId)}
        <li>
          <button
            class="flex w-full cursor-pointer flex-col gap-1 px-4 py-2.5 text-left text-foreground transition-colors duration-150 hover:bg-gray-100"
            onclick={() => onSelect(run.runId)}
          >
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-[13px] font-medium" title={run.workflowName}>
                {workflowLabel(run.workflowName)}
              </span>
              <StatusPill status={run.status} />
            </div>
            <div class="flex items-center justify-between gap-2 font-mono text-[11px] text-gray-600">
              <span>{run.runId.slice(0, 18)}…</span>
              <span>{timeAgo(run.updatedAt, getNow())}</span>
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
