<script lang="ts">
  import { useConvexClient, useQuery } from "convex-svelte";
  import { agentsApi } from "../api";
  import { duration, timeAgo } from "../format";
  import JobLog from "./JobLog.svelte";
  import StatusChip from "./StatusChip.svelte";
  import * as AlertDialog from "ui/components/alert-dialog";
  import { Alert, AlertDescription } from "ui/components/alert";
  import { Badge } from "ui/components/badge";
  import { Button, buttonVariants } from "ui/components/button";

  let {
    agentId,
    onEdit,
  }: {
    agentId: string;
    onEdit: () => void;
  } = $props();

  const client = useConvexClient();

  const agentQ = useQuery(agentsApi.get, () => ({ agentId }));
  const jobQ = useQuery(agentsApi.latestJob, () => ({ agentId }));

  const agent = $derived(agentQ.data ?? null);
  const job = $derived(jobQ.data ?? null);

  let deploying = $state(false);
  let removing = $state(false);
  let deployError = $state<string | null>(null);

  /** Deploy/edit/delete are all locked while a job is in flight. */
  const busy = $derived(
    agent?.status === "deploying" || agent?.status === "deleting",
  );

  async function deploy() {
    if (deploying) return;
    deploying = true;
    deployError = null;
    try {
      await client.mutation(agentsApi.requestDeploy, { agentId });
    } catch (err) {
      deployError = err instanceof Error ? err.message : String(err);
    } finally {
      deploying = false;
    }
  }

  async function removeAgent() {
    if (!agent || removing) return;
    removing = true;
    deployError = null;
    try {
      await client.mutation(agentsApi.remove, { agentId });
    } catch (err) {
      deployError = err instanceof Error ? err.message : String(err);
    } finally {
      removing = false;
    }
  }

  const toolList = $derived(
    agent
      ? (
          [
            ["save_note", agent.tools.saveNote],
            ["list_notes", agent.tools.listNotes],
            ["clear_notes", agent.tools.clearNotes],
            ["workflow_stats", agent.tools.workflowStats],
            // Framework tools default on for pre-toggle rows.
            ["web_fetch", agent.tools.webFetch ?? true],
            ["web_search", agent.tools.webSearch ?? true],
          ] as const
        )
          .filter(([, on]) => on)
          .map(([name]) => name)
      : [],
  );

  const webhookOn = $derived(agent?.channels?.webhook.enabled === true);
  const webhookUrl = $derived(
    agent?.deploymentUrl
      ? `${agent.deploymentUrl.replace(".convex.cloud", ".convex.site")}/channels/webhook`
      : null,
  );

  let secretShown = $state(false);
  let copiedField = $state<"url" | "secret" | null>(null);
  async function copy(text: string, field: "url" | "secret") {
    try {
      await navigator.clipboard.writeText(text);
      copiedField = field;
      setTimeout(() => (copiedField = null), 1500);
    } catch {
      // clipboard unavailable — text is selectable in place
    }
  }
</script>

{#snippet fact(label: string)}
  <dt
    class="pt-3 pb-1 font-mono text-[11px] font-medium tracking-[0.06em] text-gray-600 uppercase md:py-3"
  >
    {label}
  </dt>
{/snippet}

{#if agent}
  <div class="flex flex-col gap-7">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <h2 class="m-0 truncate text-xl leading-[26px] font-semibold tracking-[-0.4px]">
          {agent.name}
        </h2>
        <StatusChip status={agent.status} />
      </div>
      <div class="flex shrink-0 gap-2">
        <AlertDialog.Root>
          <AlertDialog.Trigger
            class={buttonVariants({ variant: "ghost", size: "sm" })}
            disabled={busy || removing}
          >
            {agent.status === "deleting" ? "Deleting…" : "Delete"}
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete “{agent.name}”?</AlertDialog.Title>
              <AlertDialog.Description>
                {#if agent.deploymentName}
                  Its credentials are revoked (no more token spend, the webhook goes dark) and it
                  disappears from the builder. The Convex project
                  <code class="font-mono text-xs">{agent.projectSlug ?? agent.deploymentName}</code>
                  keeps existing until you delete it in the Convex dashboard.
                {:else}
                  This agent was never deployed — it is removed immediately.
                {/if}
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action
                class={buttonVariants({ variant: "destructive" })}
                onclick={removeAgent}
              >
                Delete Agent
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>
        <Button variant="outline" size="sm" onclick={onEdit} disabled={busy}>Edit</Button>
        <Button size="sm" onclick={deploy} disabled={busy}>
          {agent.status === "deploying"
            ? "Deploying…"
            : agent.status === "deleting"
              ? "Deleting…"
              : agent.status === "live"
                ? "Redeploy"
                : "Deploy to Convex"}
        </Button>
      </div>
    </header>

    {#if deployError}
      <Alert variant="destructive">
        <AlertDescription class="font-mono text-xs break-all">{deployError}</AlertDescription>
      </Alert>
    {/if}

    <section>
      <h3 class="m-0 mb-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
        Configuration
      </h3>
      <dl class="m-0 grid grid-cols-1 divide-y md:grid-cols-[160px_minmax(0,1fr)] md:divide-y-0">
        {@render fact("model")}
        <dd class="m-0 border-b pb-3 font-mono text-[13px] text-gray-1000 md:flex md:items-center md:py-3">
          {agent.model}
        </dd>

        {@render fact("tools")}
        <dd class="m-0 flex flex-wrap items-center gap-1.5 border-b pb-3 md:py-3">
          {#each toolList as tool (tool)}
            <Badge variant="outline" class="font-mono">{tool}</Badge>
          {:else}
            <em class="not-italic text-sm text-muted-foreground">none</em>
          {/each}
        </dd>

        {@render fact("schedule")}
        <dd class="m-0 border-b pb-3 text-sm md:flex md:items-center md:py-3">
          {#if agent.schedule.enabled}
            <span>
              <code class="font-mono text-[13px] text-gray-1000">{agent.schedule.cron}</code>
              <span class="ml-1.5 text-xs text-muted-foreground">UTC</span>
            </span>
          {:else}
            <em class="text-muted-foreground not-italic">off</em>
          {/if}
        </dd>

        {@render fact("channels")}
        <dd class="m-0 flex flex-wrap items-center gap-1.5 border-b pb-3 md:py-3">
          {#if webhookOn}
            <Badge variant="outline" class="font-mono">webhook</Badge>
          {:else}
            <em class="text-sm text-muted-foreground not-italic">none</em>
          {/if}
        </dd>

        {@render fact("credential")}
        <dd
          class="m-0 pb-3 text-sm text-gray-1000 md:flex md:items-center md:py-3 {agent.status ===
            'live' || agent.deploymentName
            ? 'border-b'
            : ''}"
        >
          {agent.hasGatewayKey ? "deployment key stored" : "BYOK only"}
        </dd>

        {#if agent.status === "live" || agent.deploymentName}
          {@render fact("agent app")}
          <dd class="m-0 border-b pb-3 md:flex md:items-center md:py-3">
            {#if agent.dashboardUrl}
              <a
                class="font-mono text-[13px] break-all text-blue-900 hover:underline"
                href={agent.dashboardUrl}
                target="_blank"
                rel="noreferrer"
              >
                {agent.dashboardUrl} ↗
              </a>
            {:else}
              <em class="text-sm text-muted-foreground not-italic">—</em>
            {/if}
          </dd>

          {@render fact("deployment")}
          <dd
            class="m-0 pb-3 md:flex md:items-center md:py-3 {agent.bundleVersion ? 'border-b' : ''}"
          >
            {#if agent.deploymentName}
              <a
                class="font-mono text-[13px] break-all text-blue-900 hover:underline"
                href={`https://dashboard.convex.dev/d/${agent.deploymentName}`}
                target="_blank"
                rel="noreferrer"
              >
                {agent.deploymentName} ↗
              </a>
            {:else}
              <em class="text-sm text-muted-foreground not-italic">—</em>
            {/if}
          </dd>

          {#if agent.bundleVersion}
            {@render fact("bundle")}
            <dd class="m-0 flex flex-wrap items-center gap-2 pb-3 md:py-3">
              <code class="font-mono text-[13px] text-gray-1000">{agent.bundleVersion}</code>
              <span class="text-xs text-muted-foreground">
                deployed {timeAgo(agent.lastDeployedAt)}
              </span>
            </dd>
          {/if}
        {/if}
      </dl>
    </section>

    {#if webhookOn && webhookUrl && agent.webhookSecret}
      <section>
        <h3 class="m-0 mb-3 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
          Webhook Channel
        </h3>
        <div class="flex flex-col gap-2.5">
          <div class="flex flex-wrap items-center gap-2.5 text-sm">
            <span class="w-20 shrink-0 font-mono text-[11px] font-medium tracking-[0.06em] text-gray-600 uppercase">
              endpoint
            </span>
            <code class="max-w-full truncate font-mono text-xs text-gray-1000">POST {webhookUrl}</code>
            <Button size="xs" variant="outline" onclick={() => copy(webhookUrl, "url")}>
              {copiedField === "url" ? "Copied" : "Copy"}
            </Button>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 text-sm">
            <span class="w-20 shrink-0 font-mono text-[11px] font-medium tracking-[0.06em] text-gray-600 uppercase">
              secret
            </span>
            <code class="max-w-full truncate font-mono text-xs text-gray-1000">
              {secretShown ? agent.webhookSecret : "whsec_••••••••••••"}
            </code>
            <Button size="xs" variant="outline" onclick={() => (secretShown = !secretShown)}>
              {secretShown ? "Hide" : "Reveal"}
            </Button>
            <Button size="xs" variant="outline" onclick={() => copy(agent.webhookSecret!, "secret")}>
              {copiedField === "secret" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre
            class="m-0 overflow-x-auto rounded-md border bg-gray-100/50 p-3 font-mono text-[10.5px] leading-relaxed whitespace-pre text-muted-foreground">{`curl -X POST ${webhookUrl} \\
  -H 'content-type: application/json' \\
  -H 'x-webhook-secret: ${secretShown ? agent.webhookSecret : "<secret>"}' \\
  -d '{"message": "Hello ${agent.name}", "replyUrl": "https://example.com/hook"}'`}</pre>
          <p class="m-0 text-xs leading-4 text-muted-foreground">
            Reuse the returned <code class="font-mono text-[11px]">conversationId</code> to continue
            a thread. Replies POST to <code class="font-mono text-[11px]">replyUrl</code> when
            provided.
          </p>
        </div>
      </section>
    {:else if webhookOn && agent.status !== "live"}
      <p class="m-0 text-xs text-muted-foreground">
        Webhook channel enabled — endpoint and secret appear after deploy.
      </p>
    {/if}

    {#if agent.status === "failed" && agent.lastError}
      <Alert variant="destructive">
        <AlertDescription class="font-mono text-xs break-all">{agent.lastError}</AlertDescription>
      </Alert>
    {/if}

    {#if job}
      <section class="flex flex-col gap-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3
            class="m-0 flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase"
          >
            {#if job.kind === "delete"}
              {job.status === "running" || job.status === "pending" ? "Deleting" : "Teardown"}
            {:else}
              {job.status === "running" || job.status === "pending" ? "Deploying" : "Last Deploy"}
            {/if}
            {#if job.step && job.status === "running"}
              <Badge
                variant="outline"
                class="border-amber-400 bg-amber-100 font-mono normal-case text-amber-900"
              >
                <span class="size-1.5 animate-pulse rounded-full bg-current"></span>
                {job.step}
              </Badge>
            {/if}
          </h3>
          <span class="font-mono text-[11px] text-gray-600">
            {job.status}
            {#if job.startedAt}
              · {duration(job.startedAt, job.finishedAt)}
            {/if}
          </span>
        </div>
        <JobLog jobId={job._id} />
      </section>
    {/if}
  </div>
{:else if !agentQ.isLoading}
  <p class="text-xs text-muted-foreground">
    Agent not found. Pick one from the list or create a new agent.
  </p>
{/if}
