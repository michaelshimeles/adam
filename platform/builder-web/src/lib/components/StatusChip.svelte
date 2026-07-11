<script lang="ts">
  import type { AgentStatus } from "../api";
  import { Badge } from "ui/components/badge";

  let { status }: { status: AgentStatus } = $props();

  const label = $derived(
    status === "deploying" ? "deploying…" : status === "deleting" ? "deleting…" : status,
  );

  // Geist status scales: 100 bg / 400 border / 900 text.
  const tone: Record<AgentStatus, string> = {
    draft: "text-muted-foreground",
    deploying: "border-amber-400 bg-amber-100 text-amber-900",
    live: "border-green-400 bg-green-100 text-green-900",
    failed: "border-red-400 bg-red-100 text-red-900",
    deleting: "border-red-400 bg-red-100 text-red-900",
  };

  const pulse = $derived(status === "deploying" || status === "deleting");
</script>

<Badge variant="outline" class="lowercase {tone[status]}">
  <span class="size-1.5 rounded-full bg-current {pulse ? 'animate-pulse' : ''}"></span>
  {label}
</Badge>
