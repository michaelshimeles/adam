<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { agentsApi } from "../api";

  let { jobId }: { jobId: string } = $props();

  const logs = useQuery(agentsApi.jobLogs, () => ({ jobId }));

  function kind(line: string): string {
    if (line.startsWith("=====")) return "font-bold text-amber-900";
    if (line.startsWith("$ ")) return "text-blue-900";
    if (line.startsWith("✓")) return "font-semibold text-green-900";
    if (line.startsWith("✗")) return "font-semibold text-red-900";
    return "";
  }

  // Follow the tail: the attachment re-runs whenever the log length changes.
  function followTail(el: HTMLElement) {
    void logs.data?.length;
    el.scrollTop = el.scrollHeight;
  }
</script>

<pre
  {@attach followTail}
  class="m-0 max-h-[380px] overflow-auto rounded-lg border bg-black/40 p-3 font-mono text-[11.5px] leading-relaxed break-all whitespace-pre-wrap text-muted-foreground">{#if logs.data && logs.data.length > 0}{#each logs.data as row (row.seq)}<span
        class="block {kind(row.line)}">{row.line}</span>{/each}{:else}<span
      class="block text-muted-foreground/60">waiting for worker…</span>{/if}</pre>
