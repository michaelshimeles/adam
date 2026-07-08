<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";

  const health = useQuery(api.queueHealth, {});
</script>

<div class="chips">
  {#if health.data}
    <span class="chip" title="Jobs waiting for the eve host to claim">
      <span class="k">queue</span>
      <span class="v">{health.data.pending}</span>
    </span>
    <span class="chip" title="Jobs currently leased by the eve host">
      <span class="k">in flight</span>
      <span class="v">{health.data.claimed}</span>
    </span>
    <span class="chip" class:bad={health.data.dead > 0} title="Jobs that exhausted retries">
      <span class="k">dead</span>
      <span class="v">{health.data.dead}</span>
    </span>
  {:else if health.error}
    <span class="chip bad"><span class="k">convex</span><span class="v">offline</span></span>
  {:else}
    <span class="chip dim"><span class="k">queue</span><span class="v">…</span></span>
  {/if}
</div>

<style>
  .chips {
    display: flex;
    gap: 8px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 11px;
    border-radius: 999px;
    background: var(--panel-2);
    border: 1px solid var(--border-soft);
    font-size: 11.5px;
  }

  .chip .k {
    color: var(--text-faint);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 600;
  }

  .chip .v {
    color: var(--text);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .chip.bad {
    border-color: rgba(255, 98, 112, 0.4);
    background: rgba(255, 98, 112, 0.08);
  }

  .chip.bad .v {
    color: var(--red);
  }

  .chip.dim .v {
    color: var(--text-faint);
  }
</style>
