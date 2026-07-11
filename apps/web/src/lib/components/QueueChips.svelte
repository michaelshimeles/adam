<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { Badge } from "ui/components/badge";

  const health = useQuery(api.queueHealth, {});
</script>

<div class="flex gap-1.5 md:gap-2">
  {#if health.data}
    <Badge variant="outline" title="Jobs waiting for the eve host to claim">
      <span class="text-[10px] tracking-[0.04em] uppercase">queue</span>
      <span class="font-mono font-medium text-foreground tabular-nums">{health.data.pending}</span>
    </Badge>
    <Badge variant="outline" title="Jobs currently leased by the eve host">
      <span class="text-[10px] tracking-[0.04em] uppercase">in flight</span>
      <span class="font-mono font-medium text-foreground tabular-nums">{health.data.claimed}</span>
    </Badge>
    <Badge
      variant="outline"
      class={health.data.dead > 0 ? "border-red-400 bg-red-100 text-red-900" : ""}
      title="Jobs that exhausted retries"
    >
      <span class="text-[10px] tracking-[0.04em] uppercase">dead</span>
      <span
        class="font-mono font-medium tabular-nums {health.data.dead > 0
          ? 'text-red-900'
          : 'text-foreground'}">{health.data.dead}</span
      >
    </Badge>
  {:else if health.error}
    <Badge variant="outline" class="border-red-400 bg-red-100 text-red-900">
      <span class="text-[10px] tracking-[0.04em] uppercase">convex</span>
      <span class="font-mono font-medium">offline</span>
    </Badge>
  {:else}
    <Badge variant="outline">
      <span class="text-[10px] tracking-[0.04em] uppercase">queue</span>
      <span class="font-mono">…</span>
    </Badge>
  {/if}
</div>
