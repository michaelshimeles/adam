<script lang="ts">
  import { Badge } from "ui/components/badge";

  let { status }: { status: string } = $props();

  // Geist status scales: 100 bg / 400 border / 900 text.
  const tone: Record<string, string> = {
    completed: "border-green-400 bg-green-100 text-green-900",
    running: "border-blue-400 bg-blue-100 text-blue-900",
    pending: "border-amber-400 bg-amber-100 text-amber-900",
    failed: "border-red-400 bg-red-100 text-red-900",
    cancelled: "border-border bg-gray-100 text-gray-900",
  };
</script>

<Badge variant="outline" class="lowercase {tone[status] ?? 'text-muted-foreground'}">
  <span
    class="size-1.5 rounded-full bg-current {status === 'running' ? 'animate-pulse' : ''}"
  ></span>
  {status}
</Badge>
