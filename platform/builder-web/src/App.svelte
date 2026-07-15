<script lang="ts">
  import { setupConvex, useQuery } from "convex-svelte";
  import { agentsApi, BUILDER_CONVEX_URL } from "./lib/api";
  import { authArgs, dashboardSecret, isAuthError } from "./lib/auth.svelte";
  import { timeAgo } from "./lib/format";
  import AgentDetail from "./lib/components/AgentDetail.svelte";
  import AgentForm from "./lib/components/AgentForm.svelte";
  import UnlockScreen from "./lib/components/UnlockScreen.svelte";
  import { Button } from "ui/components/button";

  setupConvex(BUILDER_CONVEX_URL);

  const agents = useQuery(agentsApi.list, () => ({ ...authArgs() }));
  const heartbeat = useQuery(agentsApi.workerHeartbeat, () => ({ ...authArgs() }));

  // Deployment has BUILDER_DASHBOARD_SECRET set and ours is missing/wrong.
  const locked = $derived(isAuthError(agents.error));

  // View state: agent list is always visible; the right pane shows either
  // the "new agent" form, an editor, or the selected agent's detail.
  let selectedId = $state<string | null>(null);
  let mode = $state<"view" | "new" | "edit">("view");

  // Fall back to the first agent when nothing was explicitly selected, or
  // when the selection vanished underneath us (agent deleted).
  const effectiveId = $derived.by(() => {
    if (selectedId && agents.data?.some((a) => a._id === selectedId)) {
      return selectedId;
    }
    return agents.data?.[0]?._id ?? null;
  });
  const selected = $derived(
    agents.data?.find((a) => a._id === effectiveId) ?? null,
  );

  const workerOnline = $derived(
    typeof heartbeat.data === "number" && Date.now() - heartbeat.data < 20_000,
  );

  // Status dot colors for the sidebar rows (full chip is in the detail pane).
  const dot: Record<string, string> = {
    draft: "bg-gray-600",
    deploying: "bg-amber-900 animate-pulse",
    live: "bg-green-900",
    failed: "bg-red-900",
    deleting: "bg-red-900 animate-pulse",
  };

  function onFormDone(agentId: string | null) {
    if (agentId) selectedId = agentId;
    mode = "view";
  }
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
  <nav class="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-5">
    <div class="flex min-w-0 items-baseline gap-2.5">
      <span class="text-sm text-foreground">◆</span>
      <span class="truncate text-sm font-semibold tracking-[-0.28px]">eve agent builder</span>
      <span class="hidden font-mono text-xs text-gray-600 md:inline">
        one-click durable agents on Convex
      </span>
    </div>
    <div
      class="flex shrink-0 items-center gap-2 font-mono text-[11px] {workerOnline
        ? 'text-green-900'
        : 'text-gray-600'}"
      title={workerOnline
        ? "The build worker is polling for deploy jobs"
        : "Start the worker: pnpm --filter worker dev"}
    >
      <span class="size-1.5 rounded-full bg-current {workerOnline ? 'animate-pulse' : ''}"></span>
      {workerOnline ? "worker online" : "worker offline"}
    </div>
  </nav>

  {#if locked}
    <UnlockScreen
      hadSecret={dashboardSecret.value !== undefined}
      onSubmit={(value) => dashboardSecret.set(value)}
    />
  {:else}
    <div class="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
      <aside
        class="flex min-h-0 flex-col border-b max-md:max-h-64 md:border-r md:border-b-0"
      >
        <div class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
          <h1 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
            Agents
            {#if agents.data && agents.data.length > 0}
              <span class="ml-1 text-gray-600">{agents.data.length}</span>
            {/if}
          </h1>
          <Button
            size="xs"
            variant={agents.data && agents.data.length === 0 ? "default" : "outline"}
            onclick={() => {
              mode = "new";
            }}
          >
            New Agent
          </Button>
        </div>

        {#if agents.isLoading}
          <p class="m-0 px-4 py-4 text-xs text-muted-foreground">Loading…</p>
        {:else if !agents.data || agents.data.length === 0}
          <p class="m-0 px-4 py-4 text-xs leading-5 text-muted-foreground">
            No agents yet. Create one and deploy it to its own Convex project.
          </p>
        {:else}
          <ul class="m-0 flex min-h-0 list-none flex-col divide-y overflow-y-auto p-0">
            {#each agents.data as agent (agent._id)}
              {@const active = effectiveId === agent._id && mode !== "new"}
              <li>
                <button
                  class="flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left transition-colors duration-150 {active
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-100/60'}"
                  onclick={() => {
                    selectedId = agent._id;
                    mode = "view";
                  }}
                >
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate text-[13px] font-medium {active ? 'text-foreground' : 'text-gray-1000'}">
                      {agent.name}
                    </span>
                    <span
                      class="size-1.5 shrink-0 rounded-full {dot[agent.status] ?? 'bg-gray-600'}"
                      title={agent.status}
                    ></span>
                  </span>
                  <span class="flex items-center justify-between gap-2 font-mono text-[11px] text-gray-600">
                    <span class="truncate">{agent.model}</span>
                    <span class="shrink-0">
                      {agent.lastDeployedAt
                        ? timeAgo(agent.lastDeployedAt)
                        : timeAgo(agent.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </aside>

      <main class="min-h-0 overflow-y-auto">
        <div class="mx-auto max-w-[860px] px-4 py-6 md:px-8 md:py-8">
          {#if mode === "new"}
            <AgentForm onDone={onFormDone} />
          {:else if mode === "edit" && selected}
            {#key selected._id}
              <AgentForm agent={selected} onDone={onFormDone} />
            {/key}
          {:else if effectiveId}
            <AgentDetail
              agentId={effectiveId}
              {workerOnline}
              onEdit={() => {
                mode = "edit";
              }}
            />
          {:else}
            <div class="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
              <div
                class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-mono text-xs text-gray-600"
                aria-hidden="true"
              >
                <span class="rounded-md border bg-gray-100 px-2.5 py-1.5 text-gray-900">instructions.md</span>
                <span>→</span>
                <span class="rounded-md border bg-gray-100 px-2.5 py-1.5 text-gray-900">eve build</span>
                <span>→</span>
                <span class="rounded-md border bg-gray-100 px-2.5 py-1.5 text-gray-900">convex deploy</span>
                <span>→</span>
                <span class="rounded-md border border-green-400 bg-green-100 px-2.5 py-1.5 text-green-900">live url</span>
              </div>
              <div class="max-w-md">
                <h2 class="m-0 text-base leading-6 font-semibold tracking-[-0.32px] text-gray-1000">
                  Deploy your first agent
                </h2>
                <p class="mt-2 mb-0 text-sm leading-5 text-muted-foreground">
                  Pick a model, write instructions, toggle tools and a schedule —
                  the worker compiles it and deploys it to its own Convex project.
                </p>
              </div>
              <Button
                onclick={() => {
                  mode = "new";
                }}
              >
                New Agent
              </Button>
            </div>
          {/if}
        </div>
      </main>
    </div>
  {/if}
</div>
