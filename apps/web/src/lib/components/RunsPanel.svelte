<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { timeAgo, workflowLabel } from "../format";
  import { getNow } from "../now.svelte";

  let { onSelect }: { onSelect: (runId: string) => void } = $props();

  const runs = useQuery(api.listRuns, { limit: 30 });
</script>

<section class="panel">
  <header>
    <h2>Workflow runs</h2>
    <span class="sub">durable state in Convex</span>
  </header>

  {#if runs.isLoading}
    <div class="empty">Loading…</div>
  {:else if runs.error}
    <div class="empty error">Can't reach Convex</div>
  {:else if runs.data.length === 0}
    <div class="empty">
      No runs yet — send the agent a message and its workflow run will appear
      here.
    </div>
  {:else}
    <ul>
      {#each runs.data as run (run.runId)}
        <li>
          <button class="run" onclick={() => onSelect(run.runId)}>
            <div class="row">
              <span class="name" title={run.workflowName}>
                {workflowLabel(run.workflowName)}
              </span>
              <span class="pill {run.status}">
                <span class="dot"></span>{run.status}
              </span>
            </div>
            <div class="row meta">
              <span class="id">{run.runId.slice(0, 18)}…</span>
              <span>{timeAgo(run.updatedAt, getNow())}</span>
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .panel {
    background: var(--panel);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .sub {
    font-size: 10.5px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 600;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
  }

  .run {
    width: 100%;
    text-align: left;
    background: var(--panel-2);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    color: inherit;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background 120ms ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .run:hover {
    border-color: var(--border);
    background: #1a1e2a;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .name {
    font-size: 12.5px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    font-size: 11px;
    color: var(--text-faint);
  }

  .id {
    font-family: var(--mono);
  }

  .empty {
    color: var(--text-faint);
    font-size: 12.5px;
    padding: 18px 6px;
    text-align: center;
    line-height: 1.5;
  }

  .empty.error {
    color: var(--red);
  }
</style>
