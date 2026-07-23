<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import type { AgentSummary } from "../api";
  import { agentsApi, MODEL_SUGGESTIONS, PREFILL_GATEWAY_KEY } from "../api";
  import { authArgs } from "../auth.svelte";
  import { Alert, AlertDescription } from "ui/components/alert";
  import { Button } from "ui/components/button";
  import { Checkbox } from "ui/components/checkbox";
  import { Input } from "ui/components/input";
  import { Label } from "ui/components/label";
  import { Switch } from "ui/components/switch";
  import { Textarea } from "ui/components/textarea";

  let {
    agent = null,
    onDone,
  }: {
    /** Present when editing; null when creating. */
    agent?: AgentSummary | null;
    onDone: (agentId: string | null) => void;
  } = $props();

  const client = useConvexClient();

  const DEFAULT_INSTRUCTIONS = `# My Agent

You are a helpful, durable agent running on Convex.

- Use save_note to remember things the user asks you to keep.
- Use list_notes to recall them.
- Be concise and warm.`;

  // One-time snapshot of the agent being edited — intentional: App keys this
  // component by agent id, so editing a different agent mounts a fresh form.
  // svelte-ignore state_referenced_locally
  const initial = agent;

  let name = $state(initial?.name ?? "");
  let model = $state(initial?.model ?? "anthropic/claude-sonnet-5");
  let instructions = $state(initial?.instructions ?? DEFAULT_INSTRUCTIONS);
  let tools = $state({
    saveNote: initial?.tools.saveNote ?? true,
    listNotes: initial?.tools.listNotes ?? true,
    clearNotes: initial?.tools.clearNotes ?? true,
    workflowStats: initial?.tools.workflowStats ?? true,
    webFetch: initial?.tools.webFetch ?? true,
    webSearch: initial?.tools.webSearch ?? true,
    memory: initial?.tools.memory ?? true,
    skills: initial?.tools.skills ?? true,
    reminders: initial?.tools.reminders ?? true,
    eventTriggers: initial?.tools.eventTriggers ?? true,
    receipts: initial?.tools.receipts ?? true,
    extras: initial?.tools.extras ?? true,
    delegation: initial?.tools.delegation ?? true,
  });
  const TOOL_META: { key: keyof typeof tools; name: string; hint: string }[] = [
    { key: "saveNote", name: "save_note", hint: "persist a note" },
    { key: "listNotes", name: "list_notes", hint: "recall notes" },
    { key: "clearNotes", name: "clear_notes", hint: "wipe notes (human approval)" },
    { key: "workflowStats", name: "workflow_stats", hint: "introspect own runtime" },
    { key: "webFetch", name: "web_fetch", hint: "read pages as markdown" },
    { key: "webSearch", name: "web_search", hint: "search the web" },
  ];
  const CAPABILITY_META: { key: keyof typeof tools; name: string; hint: string }[] = [
    { key: "memory", name: "memory", hint: "remember/forget + profile + nightly consolidation" },
    { key: "skills", name: "skills", hint: "chat-created reusable skills" },
    { key: "reminders", name: "reminders", hint: "one-off + recurring, delivered proactively" },
    { key: "eventTriggers", name: "event triggers", hint: "agent-created webhook URLs" },
    { key: "receipts", name: "receipts", hint: "spending log + summaries" },
    { key: "extras", name: "extras", hint: "weather + dice" },
    { key: "delegation", name: "delegation", hint: "subagent workflow tool" },
  ];
  let timezone = $state(initial?.timezone ?? "UTC");
  let webhookEnabled = $state(initial?.channels?.webhook.enabled ?? false);
  let telegramEnabled = $state(initial?.channels?.telegram?.enabled ?? false);
  let telegramAllowedUserIds = $state(initial?.channels?.telegram?.allowedUserIds ?? "");
  let telegramToken = $state("");
  let composioKey = $state("");
  let convexDeployKey = $state("");
  let scheduleEnabled = $state(initial?.schedule.enabled ?? false);
  let scheduleCron = $state(initial?.schedule.cron ?? "0 * * * *");
  let schedulePrompt = $state(
    initial?.schedule.prompt ??
      "Check workflow health with the workflow_stats tool. If anything looks unhealthy, save a short incident note prefixed with [heartbeat].",
  );
  // Prefill from local env unless the agent already has a stored key (blank
  // means "keep it" on edit — don't overwrite with the local one unasked).
  const prefilled = !initial?.hasGatewayKey && PREFILL_GATEWAY_KEY !== "";
  let gatewayKey = $state(prefilled ? PREFILL_GATEWAY_KEY : "");
  let saving = $state(false);
  let error = $state<string | null>(null);

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;
    saving = true;
    error = null;
    const config = {
      name,
      model,
      instructions,
      tools: { ...tools },
      timezone,
      schedule: {
        enabled: scheduleEnabled,
        cron: scheduleCron,
        prompt: schedulePrompt,
      },
      channels: {
        webhook: { enabled: webhookEnabled },
        telegram: { enabled: telegramEnabled, allowedUserIds: telegramAllowedUserIds },
      },
    };
    try {
      if (agent) {
        await client.mutation(agentsApi.update, {
          agentId: agent._id,
          ...config,
          ...authArgs(),
          // Only replace stored secrets when a new value was typed.
          ...(gatewayKey.trim() ? { aiGatewayApiKey: gatewayKey.trim() } : {}),
          ...(telegramToken.trim() ? { telegramBotToken: telegramToken.trim() } : {}),
          ...(composioKey.trim() ? { composioApiKey: composioKey.trim() } : {}),
          ...(convexDeployKey.trim() ? { convexDeployKey: convexDeployKey.trim() } : {}),
        });
        onDone(agent._id);
      } else {
        const id = await client.mutation(agentsApi.create, {
          ...config,
          ...authArgs(),
          ...(gatewayKey.trim() ? { aiGatewayApiKey: gatewayKey.trim() } : {}),
          ...(telegramToken.trim() ? { telegramBotToken: telegramToken.trim() } : {}),
          ...(composioKey.trim() ? { composioApiKey: composioKey.trim() } : {}),
          ...(convexDeployKey.trim() ? { convexDeployKey: convexDeployKey.trim() } : {}),
        });
        onDone(id);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      saving = false;
    }
  }
</script>

{#snippet sectionTitle(title: string, hint?: string)}
  <div class="flex flex-wrap items-baseline gap-2">
    <h3 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
      {title}
    </h3>
    {#if hint}
      <span class="text-xs text-muted-foreground">{hint}</span>
    {/if}
  </div>
{/snippet}

<form onsubmit={save} class="flex flex-col gap-7">
  <header class="flex flex-wrap items-center justify-between gap-3">
    <h2 class="m-0 text-xl leading-[26px] font-semibold tracking-[-0.4px]">
      {agent ? `Edit ${agent.name}` : "New Agent"}
    </h2>
    <div class="flex shrink-0 gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={() => onDone(agent?._id ?? null)}
      >
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : agent ? "Save Changes" : "Create Agent"}
      </Button>
    </div>
  </header>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Identity")}
    <div class="grid gap-3 md:grid-cols-2">
      <div class="flex flex-col gap-1.5">
        <Label for="agent-name">Name</Label>
        <Input id="agent-name" bind:value={name} placeholder="Haiku Scribe" required minlength={2} />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="agent-model">
          Model <span class="font-normal text-muted-foreground">(AI Gateway id)</span>
        </Label>
        <Input id="agent-model" bind:value={model} list="model-suggestions" class="font-mono" required />
        <datalist id="model-suggestions">
          {#each MODEL_SUGGESTIONS as m (m)}
            <option value={m}></option>
          {/each}
        </datalist>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="agent-timezone">
          Timezone <span class="font-normal text-muted-foreground">(IANA — reminders + time rendering)</span>
        </Label>
        <Input
          id="agent-timezone"
          bind:value={timezone}
          class="font-mono"
          placeholder="America/Toronto"
          required
        />
      </div>
    </div>
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Instructions", "the agent's system prompt — agent/instructions.md")}
    <Textarea
      id="agent-instructions"
      bind:value={instructions}
      rows={9}
      class="font-mono text-[13px] leading-5"
      required
    />
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Tools", "what the agent is allowed to do")}
    <div class="grid gap-x-6 gap-y-2.5 md:grid-cols-2">
      {#each TOOL_META as tool (tool.key)}
        <div class="flex items-center gap-2.5">
          <Checkbox id="tool-{tool.key}" bind:checked={tools[tool.key]} />
          <Label for="tool-{tool.key}" class="gap-1.5 font-normal">
            <code class="font-mono text-xs">{tool.name}</code>
            <span class="text-xs text-muted-foreground">— {tool.hint}</span>
          </Label>
        </div>
      {/each}
    </div>
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Assistant capabilities", "eve-style personal-assistant features")}
    <div class="grid gap-x-6 gap-y-2.5 md:grid-cols-2">
      {#each CAPABILITY_META as cap (cap.key)}
        <div class="flex items-center gap-2.5">
          <Checkbox id="cap-{cap.key}" bind:checked={tools[cap.key]} />
          <Label for="cap-{cap.key}" class="gap-1.5 font-normal">
            <code class="font-mono text-xs">{cap.name}</code>
            <span class="text-xs text-muted-foreground">— {cap.hint}</span>
          </Label>
        </div>
      {/each}
    </div>
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Channels", "ways in besides the dashboard chat")}
    <div class="flex items-center gap-2.5">
      <Checkbox id="channel-webhook" bind:checked={webhookEnabled} />
      <Label for="channel-webhook" class="gap-1.5 font-normal">
        <code class="font-mono text-xs">webhook</code>
        <span class="text-xs text-muted-foreground">
          — inbound HTTP endpoint (POST /channels/webhook, secured by a generated secret)
        </span>
      </Label>
    </div>
    {#if webhookEnabled}
      <p class="m-0 text-xs leading-4 text-muted-foreground">
        External systems message the agent with an
        <code class="font-mono text-[11px]">x-webhook-secret</code> header; the secret appears on
        the agent page after deploy. Optional
        <code class="font-mono text-[11px]">replyUrl</code> in the body receives the agent's
        replies.
      </p>
      {#if !agent?.hasGatewayKey && !gatewayKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Webhook sessions run on the deployment's own credential — add an AI Gateway key below or
          webhook turns will fail.
        </p>
      {/if}
    {/if}
    <div class="flex items-center gap-2.5">
      <Checkbox id="channel-telegram" bind:checked={telegramEnabled} />
      <Label for="channel-telegram" class="gap-1.5 font-normal">
        <code class="font-mono text-xs">telegram</code>
        <span class="text-xs text-muted-foreground">
          — chat with the agent from Telegram (private DMs; needs a bot token from @BotFather)
        </span>
      </Label>
    </div>
    {#if telegramEnabled}
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label for="telegram-token" class="flex-wrap">
            Bot token
            <span class="font-normal text-muted-foreground">
              {agent?.hasTelegramToken ? "(stored — leave blank to keep it)" : "(required)"}
            </span>
          </Label>
          <Input
            id="telegram-token"
            bind:value={telegramToken}
            type="password"
            class="font-mono"
            placeholder={agent?.hasTelegramToken ? "•••••••• (stored)" : "123456:ABC…"}
            autocomplete="off"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="telegram-allowlist">
            Allowed user ids
            <span class="font-normal text-muted-foreground">(comma-separated; blank = any private DM)</span>
          </Label>
          <Input
            id="telegram-allowlist"
            bind:value={telegramAllowedUserIds}
            class="font-mono"
            placeholder="12345678, 87654321"
          />
        </div>
      </div>
      <p class="m-0 text-xs leading-4 text-muted-foreground">
        The deploy registers the bot's webhook automatically. Telegram sessions run on the
        deployment's own credential.
      </p>
      {#if !agent?.hasGatewayKey && !gatewayKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Telegram sessions run on the deployment's own credential — add an AI Gateway key below
          or Telegram turns will fail.
        </p>
      {/if}
    {/if}
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Integrations")}
    <div class="flex flex-col gap-1.5">
      <Label for="composio-key" class="flex-wrap">
        Composio API key
        <span class="font-normal text-muted-foreground">
          (optional — connects Gmail, Calendar, Notion, Slack and 1000+ apps via MCP{agent?.hasComposioKey
            ? "; a key is already stored, leave blank to keep it"
            : ""})
        </span>
      </Label>
      <Input
        id="composio-key"
        bind:value={composioKey}
        type="password"
        class="font-mono"
        placeholder={agent?.hasComposioKey ? "•••••••• (stored)" : "ak_…"}
        autocomplete="off"
      />
    </div>
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    <div class="flex items-center gap-2.5">
      <Switch id="schedule-enabled" bind:checked={scheduleEnabled} />
      <Label for="schedule-enabled" class="font-mono text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
        Schedule
      </Label>
      <span class="text-xs text-muted-foreground">cron-triggered agent session</span>
    </div>
    {#if scheduleEnabled}
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label for="schedule-cron">
            Cron <span class="font-normal text-muted-foreground">(UTC, 5 fields)</span>
          </Label>
          <Input
            id="schedule-cron"
            bind:value={scheduleCron}
            class="font-mono"
            placeholder="0 * * * *"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="schedule-prompt">Schedule prompt</Label>
        <Textarea id="schedule-prompt" bind:value={schedulePrompt} rows={3} />
      </div>
      {#if !agent?.hasGatewayKey && !gatewayKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Schedules run on the deployment's own credential — add an AI Gateway key below or
          scheduled sessions will fail.
        </p>
      {/if}
    {/if}
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Credential")}
    <div class="flex flex-col gap-1.5">
      <Label for="gateway-key" class="flex-wrap">
        AI Gateway API key
        <span class="font-normal text-muted-foreground">
          (optional — powers scheduled + webhook sessions; chat visitors bring their own key{agent?.hasGatewayKey
            ? "; a key is already stored, leave blank to keep it"
            : ""})
        </span>
      </Label>
      <Input
        id="gateway-key"
        bind:value={gatewayKey}
        type="password"
        class="font-mono"
        placeholder={agent?.hasGatewayKey ? "•••••••• (stored)" : "vck_…"}
        autocomplete="off"
      />
      {#if prefilled && gatewayKey === PREFILL_GATEWAY_KEY}
        <p class="m-0 font-mono text-[11px] text-green-900">
          prefilled from your local env (VITE_AI_GATEWAY_API_KEY)
        </p>
      {/if}
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="convex-deploy-key" class="flex-wrap">
        Convex deploy key
        <span class="font-normal text-muted-foreground">
          (optional — deploy this agent into your own Convex project instead of the
          builder's account{agent?.hasConvexDeployKey
            ? "; a key is already stored, leave blank to keep it"
            : ""})
        </span>
      </Label>
      <Input
        id="convex-deploy-key"
        bind:value={convexDeployKey}
        type="password"
        class="font-mono"
        placeholder={agent?.hasConvexDeployKey
          ? "•••••••• (stored)"
          : "prod:your-deployment-123|…"}
        autocomplete="off"
      />
      <p class="m-0 text-xs leading-4 text-muted-foreground">
        Generate one in your Convex project under Settings → Deploy key. The agent's
        functions, data and web app all live in that deployment.
        {#if agent?.deploymentName}
          Can't be added or removed after the first deploy.
        {/if}
      </p>
    </div>
  </section>

  {#if error}
    <Alert variant="destructive">
      <AlertDescription class="font-mono text-xs break-all">{error}</AlertDescription>
    </Alert>
  {/if}

  <div class="flex gap-2.5 border-t pt-5">
    <Button type="submit" disabled={saving}>
      {saving ? "Saving…" : agent ? "Save Changes" : "Create Agent"}
    </Button>
    <Button type="button" variant="ghost" onclick={() => onDone(agent?._id ?? null)}>
      Cancel
    </Button>
  </div>
</form>
