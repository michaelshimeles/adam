<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import type { AgentSummary, ModelKeyProvider, ModelOption } from "../api";
  import {
    agentsApi,
    keysApi,
    modelsApi,
    MODEL_SUGGESTIONS,
    PREFILL_GATEWAY_KEY,
  } from "../api";
  import { authArgs } from "../auth.svelte";
  import { Alert, AlertDescription } from "ui/components/alert";
  import { Button } from "ui/components/button";
  import { Checkbox } from "ui/components/checkbox";
  import { Input } from "ui/components/input";
  import { Label } from "ui/components/label";
  import { Switch } from "ui/components/switch";
  import { Textarea } from "ui/components/textarea";
  import ModelPicker from "./ModelPicker.svelte";

  let {
    agent = null,
    onDone,
  }: {
    /** Present when editing; null when creating. */
    agent?: AgentSummary | null;
    onDone: (agentId: string | null) => void;
  } = $props();

  const client = useConvexClient();

  const DEFAULT_INSTRUCTIONS = `# Identity

You are Eve, Micky's personal assistant. Micky is your only
user. You are a trusted daily driver: helpful, direct, and personal. You talk over the web chat.

# Style

- Formatting depends on the channel; a note injected each turn tells you
  whether the current conversation renders markdown (web chat) or needs plain
  text (Telegram). Follow it.
- Be concise by default. Lead with the answer, keep detail for when they ask.
- Be warm but not chatty. Skip filler like "Great question!"
- Numbers, dates, and times: use their local timezone (injected each turn).

# Memory

You have long-term memory that persists across all conversations. A profile of
what you know about Micky (stable facts plus recent context) is injected into
every turn.

- When Micky shares a durable fact or preference (their city, routines, people,
  projects, likes, dislikes), save it with the remember tool without being
  asked, and mention it in one short phrase, like "noted - saved that." Phrase
  memories entity-centric ("Micky prefers window seats") and mark stable
  traits (name, city, family, work) as permanent.
- When a fact changes, save the new version with remember; memory reconciles
  updates and contradictions on its own.
- If they reference something not covered by your injected profile, check with
  search_memory before saying you do not know.
- To forget something (they ask, or a fact is clearly obsolete), find its id
  with search_memory or list_memories, then delete it with forget.
- Never save secrets: no passwords, API keys, tokens, card numbers, or one-time
  codes, even if asked. Explain why in one line instead.
- Answer "what do you know about me" from your injected profile, adding
  list_memories when they want the full inventory.
- A nightly consolidation pass merges duplicates, resolves contradictions,
  and promotes recurring facts to permanent, so save freely during the day
  without worrying about clutter.

# Skills you can create

You can save skills: named, reusable procedures. When
Micky describes a repeatable workflow, routine, or output format they want
again later, offer to save it as a skill with create_skill.

- Write the skill markdown as instructions to your future self, capturing
  their exact preferences.
- A new or updated skill applies from the next conversation onward; say so in
  one short phrase when you save one.
- Your saved skills are inlined into your instructions each session. When a
  request matches one's "When to use" line, follow it.
- Delete with delete_skill when they ask, or offer it when one is obsolete.

# Receipts

Micky can track spending by photographing receipts.

- When they send a photo of a receipt, read it and log it with log_receipt:
  merchant, total, date, best-fit category, and line items when legible.
  Confirm in one short line: merchant, total, category, date.
- If the image is not a receipt or is unreadable, say so instead of logging.
- If the receipt shows no date, use today. Use the currency printed on the
  receipt.
- Answer spending questions with query_receipts and spending_summary.
- To fix a wrong entry: locate it with query_receipts, delete_receipt it,
  then log the corrected version.

# Capabilities

- Composio connection: your gateway to Micky's real apps (Gmail, Google
  Calendar, Notion, Slack, GitHub, and more). Use connection_search to find
  its tools. When an app is not connected yet, request authorization through
  Composio and send Micky the resulting link as a plain URL so they can
  approve it in their browser, then continue once they say it is done.
- Before sending messages or emails, deleting data, or spending money through
  a connected app, state exactly what you are about to do and get a yes in
  chat first. Reading and searching need no confirmation.
- get_weather: live weather for any city.
- roll_dice: dice and random picks.
- Web tools: look things up when freshness matters; say when info might be
  stale rather than guessing.
- Sandbox (bash and files): calculations, quick scripts, working through data.
- In web chat, HTML code blocks get a live preview button. For small visual
  artifacts - a quick chart, a mockup, an interactive widget - a fenced
  \`\`\`html block with inline CSS/JS is often the nicest delivery.
- If a turn's client context includes \`forkedThreadTranscript\`, Micky forked
  an earlier conversation into this new thread. That transcript is your shared
  history - treat it as things you already discussed and continue naturally.
- If a tool fails, say what went wrong plainly and offer the next best step.

# Reminders & scheduled tasks

You can wake yourself up in the future and message Micky proactively.
Use this whenever they ask for a reminder, a recurring brief, or any "do X
at/every Y" request.

- create_reminder: one-off (fireAt, ISO time with offset in their timezone) or
  recurring (5-field cron plus timezone, e.g. "0 8 * * 1-5" for weekday
  mornings). The prompt is an instruction to your future self, which wakes
  with no chat history - pack in everything needed: what to do, what to
  check, and what to send.
- Reminders can do real work, not just nudge: "every morning at 8, check my
  calendar and email and send a brief" is one recurring reminder whose prompt
  says exactly that.
- list_reminders shows what's scheduled; cancel_reminder stops one. When they
  change a recurring task, cancel the old one and create the new version.
- After creating one, confirm in one line with the resolved next fire time in
  their local timezone.
- Timing granularity is one minute. Fired reminders show up as new threads in the web chat sidebar.

# Event triggers (webhooks)

Besides the clock, external events can wake you. When Micky wants you to
react to something happening (a failed deploy, a form submission, a payment,
an email rule), create a webhook with create_webhook.

- The tool returns a URL. Send it to Micky to paste into the sending
  service, with one line on where to put it if you know the service. The URL
  embeds its secret, so treat it like a password.
- The prompt is an instruction to your future self, which wakes with only the
  event payload and no chat history: say how to read the payload, what to do,
  and what to send.
- When an event fires you do real work, not just forward JSON: summarize what
  happened, pull extra context through your tools when useful, and lead with
  what this is about since Micky didn't just message you.
- list_webhooks shows existing triggers (and their URLs); delete_webhook
  removes one.
- For sources that cannot send webhooks, fall back to a recurring reminder
  that polls instead.

# Delegation

For big or parallelizable jobs, you can delegate to fresh copies of yourself
instead of grinding through everything in one thread.

- agent tool: hands a task to a fresh copy of you with the same tools and
  sandbox but no conversation history. Pack the message with everything the
  copy needs (context, links, exact deliverable, output format). To run
  independent tasks in parallel, emit several agent calls in one response.
- Workflow tool: for fan-out that depends on runtime data (one subagent per
  item in a list you compute first, feeding one result into the next,
  map-reduce). You write a short JS program that calls tools.agent(...); keep
  within the stated subagent budget.
- Use delegation when a request splits into independent chunks; skip it for
  anything a few direct tool calls handle.
- Children cannot ask Micky questions, so resolve ambiguity before
  delegating. Merge results into one coherent answer; don't paste raw
  subagent output.
- Delegated work is durable: it survives restarts, so a long research batch
  is fine. Warn Micky when something will take a while.

# Judgment

- Ask at most one clarifying question, and only when the request is truly
  ambiguous. Otherwise make the sensible assumption and say what you assumed.
- For anything irreversible or externally visible, confirm first.
- You are an AI assistant; be transparent about that if it ever matters.`;

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
  let timezone = $state(initial?.timezone ?? "America/New_York");
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
  const PROVIDER_LABELS: Record<ModelKeyProvider, string> = {
    gateway: "Vercel AI Gateway",
    openrouter: "OpenRouter",
  };
  /** Which provider the agent's stored credential belongs to (edit mode). */
  const storedProvider: ModelKeyProvider | null = initial?.hasGatewayKey
    ? (initial.modelKeyProvider ?? "gateway")
    : null;
  let keyProvider = $state<ModelKeyProvider>(storedProvider ?? "gateway");
  // Prefill from local env unless the agent already has a stored key (blank
  // means "keep it" on edit — don't overwrite with the local one unasked).
  // The env prefill is a gateway key, so it only applies to that provider.
  const prefilled = !initial?.hasGatewayKey && PREFILL_GATEWAY_KEY !== "";
  let modelApiKey = $state(prefilled ? PREFILL_GATEWAY_KEY : "");
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Model key check, run in the form so a bad credential surfaces here
  // instead of as broken chat/scheduled sessions after deploy.
  let keyCheck = $state<{
    status: "idle" | "checking" | "valid" | "invalid";
    message: string;
  }>({ status: "idle", message: "" });
  let checkedKey = ""; // the key+provider the current keyCheck verdict applies to
  let checkSeq = 0; // ignores stale in-flight responses after edits

  async function validateModelKey(): Promise<boolean> {
    const key = modelApiKey.trim();
    if (key === "") {
      // Edit with a stored key: leave blank to keep it. Create: required.
      keyCheck = { status: "idle", message: "" };
      return Boolean(agent?.hasGatewayKey);
    }
    if (`${keyProvider}:${key}` === checkedKey && keyCheck.status === "valid") {
      return true;
    }
    const seq = ++checkSeq;
    keyCheck = {
      status: "checking",
      message: `checking key with ${PROVIDER_LABELS[keyProvider]}…`,
    };
    try {
      const result = await client.action(keysApi.validate, {
        apiKey: key,
        provider: keyProvider,
        ...authArgs(),
      });
      if (seq !== checkSeq) return false; // superseded by a newer check
      checkedKey = `${keyProvider}:${key}`;
      keyCheck = result.ok
        ? {
            status: "valid",
            message: result.balance
              ? `key valid — $${result.balance} balance`
              : "key valid",
          }
        : { status: "invalid", message: result.error ?? "Invalid key." };
      return result.ok;
    } catch (err) {
      if (seq !== checkSeq) return false;
      checkedKey = `${keyProvider}:${key}`;
      keyCheck = {
        status: "invalid",
        message: err instanceof Error ? err.message : "Key check failed.",
      };
      return false;
    }
  }

  function switchProvider(next: ModelKeyProvider): void {
    if (keyProvider === next) return;
    keyProvider = next;
    checkSeq++; // drop any in-flight check for the other provider
    checkedKey = "";
    // A key from one provider is meaningless to the other — reset the field
    // (back to the env prefill when returning to the gateway on create).
    modelApiKey = next === "gateway" && prefilled ? PREFILL_GATEWAY_KEY : "";
    keyCheck = { status: "idle", message: "" };
    if (modelApiKey !== "") void validateModelKey();
  }

  // A prefilled env key gets checked right away, so the badge is meaningful.
  if (prefilled) void validateModelKey();

  // Model catalog for the picker — the same list the deployed site's picker
  // shows. Fetched with the key typed in the form once it validates, or
  // (edit mode) with the agent's stored credential server-side. Empty until
  // a key exists; the model field falls back to free text then.
  let catalog = $state<ModelOption[]>([]);
  $effect(() => {
    const typed = modelApiKey.trim();
    const validTyped = keyCheck.status === "valid" && typed !== "";
    const params = validTyped
      ? { apiKey: typed, provider: keyProvider }
      : initial?.hasGatewayKey
        ? { agentId: initial._id }
        : null;
    if (params === null) {
      catalog = [];
      return;
    }
    let cancelled = false;
    void client
      .action(modelsApi.list, { ...params, ...authArgs() })
      .then((result) => {
        if (!cancelled) catalog = result.models;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;
    saving = true;
    error = null;
    // Key is required for create; on edit a blank field keeps the stored key.
    if (!modelApiKey.trim() && !agent?.hasGatewayKey) {
      error =
        "A model API key (AI Gateway or OpenRouter) is required — chat and schedules bill this key.";
      saving = false;
      return;
    }
    // Gate the save on the key check: a bad key would only surface after
    // deploy as failed chat / schedule sessions.
    if (modelApiKey.trim() && !(await validateModelKey())) {
      error = `${PROVIDER_LABELS[keyProvider]} key: ${keyCheck.message}`;
      saving = false;
      return;
    }
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
          ...(modelApiKey.trim()
            ? keyProvider === "openrouter"
              ? { openRouterApiKey: modelApiKey.trim() }
              : { aiGatewayApiKey: modelApiKey.trim() }
            : {}),
          ...(telegramToken.trim() ? { telegramBotToken: telegramToken.trim() } : {}),
          ...(composioKey.trim() ? { composioApiKey: composioKey.trim() } : {}),
          ...(convexDeployKey.trim() ? { convexDeployKey: convexDeployKey.trim() } : {}),
        });
        onDone(agent._id);
      } else {
        const id = await client.mutation(agentsApi.create, {
          ...config,
          ...authArgs(),
          ...(keyProvider === "openrouter"
            ? { openRouterApiKey: modelApiKey.trim() }
            : { aiGatewayApiKey: modelApiKey.trim() }),
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
          Model
          <span class="font-normal text-muted-foreground">
            {catalog.length > 0 ? "(from your key's catalog)" : "(model id)"}
          </span>
        </Label>
        {#if catalog.length > 0}
          <ModelPicker models={catalog} value={model} onSelect={(id) => (model = id)} />
        {:else}
          <Input id="agent-model" bind:value={model} list="model-suggestions" class="font-mono" required />
          <datalist id="model-suggestions">
            {#each MODEL_SUGGESTIONS as m (m)}
              <option value={m}></option>
            {/each}
          </datalist>
        {/if}
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
      class="max-h-72 overflow-y-auto font-mono text-[13px] leading-5"
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
      {#if !agent?.hasGatewayKey && !modelApiKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Webhook sessions run on the deployment's own credential — add a model API key below or
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
      {#if !agent?.hasGatewayKey && !modelApiKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Telegram sessions run on the deployment's own credential — add a model API key below
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
      {#if !agent?.hasGatewayKey && !modelApiKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Schedules run on the deployment's own credential — add a model API key below or
          scheduled sessions will fail.
        </p>
      {/if}
    {/if}
  </section>

  <section class="flex flex-col gap-3 border-t pt-5">
    {@render sectionTitle("Credential")}
    <div class="flex flex-col gap-1.5">
      <Label for="model-key" class="flex-wrap">
        Model API key
        <span class="font-normal text-muted-foreground">
          {agent?.hasGatewayKey
            ? `(required — leave blank to keep the stored ${PROVIDER_LABELS[storedProvider ?? "gateway"]} key; powers chat, schedules, and webhooks)`
            : "(required — powers chat, schedules, and webhooks on the deployed agent)"}
        </span>
      </Label>
      <div class="grid grid-cols-2 gap-1 rounded-md border p-1" role="tablist" aria-label="Key provider">
        <button
          type="button"
          role="tab"
          aria-selected={keyProvider === "gateway"}
          class="cursor-pointer rounded px-3 py-1.5 font-mono text-xs transition-colors duration-150 {keyProvider ===
          'gateway'
            ? 'bg-gray-200 text-foreground'
            : 'text-muted-foreground hover:bg-gray-100'}"
          onclick={() => switchProvider("gateway")}
        >
          Vercel AI Gateway
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={keyProvider === "openrouter"}
          class="cursor-pointer rounded px-3 py-1.5 font-mono text-xs transition-colors duration-150 {keyProvider ===
          'openrouter'
            ? 'bg-gray-200 text-foreground'
            : 'text-muted-foreground hover:bg-gray-100'}"
          onclick={() => switchProvider("openrouter")}
        >
          OpenRouter
        </button>
      </div>
      <Input
        id="model-key"
        bind:value={modelApiKey}
        type="password"
        class="font-mono"
        placeholder={agent?.hasGatewayKey && storedProvider === keyProvider
          ? "•••••••• (stored)"
          : keyProvider === "openrouter"
            ? "sk-or-…"
            : "vck_…"}
        autocomplete="off"
        oninput={() => {
          if (keyCheck.status !== "idle") keyCheck = { status: "idle", message: "" };
        }}
        onblur={() => void validateModelKey()}
      />
      {#if keyCheck.status === "checking"}
        <p class="m-0 font-mono text-[11px] text-muted-foreground">{keyCheck.message}</p>
      {:else if keyCheck.status === "valid"}
        <p class="m-0 font-mono text-[11px] text-green-900">{keyCheck.message}</p>
      {:else if keyCheck.status === "invalid"}
        <p class="m-0 font-mono text-[11px] text-red-900">{keyCheck.message}</p>
      {:else if prefilled && keyProvider === "gateway" && modelApiKey === PREFILL_GATEWAY_KEY}
        <p class="m-0 font-mono text-[11px] text-green-900">
          prefilled from your local env (VITE_AI_GATEWAY_API_KEY)
        </p>
      {/if}
      {#if agent?.hasGatewayKey && storedProvider !== keyProvider && !modelApiKey.trim()}
        <p class="m-0 text-xs leading-4 text-amber-900">
          Saving a {PROVIDER_LABELS[keyProvider]} key replaces the stored
          {PROVIDER_LABELS[storedProvider ?? "gateway"]} key. Leave the
          {PROVIDER_LABELS[storedProvider ?? "gateway"]} tab selected to keep it.
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
