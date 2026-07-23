<script lang="ts">
  import type {
    EveDynamicToolPart,
    EveMessage,
    EveMessageInputRequest,
  } from "eve/client";
  import { useConvexClient } from "convex-svelte";
  import type { createChatSession } from "../chat.svelte";
  import { BRAND_NAME } from "../brand";
  import { modelsApi, type ModelOption } from "../api";
  import { modelKey } from "../apiKey.svelte";
  import { DEFAULT_MODEL_ID, webModel } from "../models.svelte";
  import { Button } from "ui/components/button";
  import Markdown from "./Markdown.svelte";
  import ModelPicker from "./ModelPicker.svelte";

  let { agent }: { agent: ReturnType<typeof createChatSession> } = $props();

  let draft = $state("");
  let hitlText = $state<Record<string, string>>({});

  const client = useConvexClient();

  // Model catalog for the composer's picker, fetched with the visitor's own
  // key once one exists (the catalog endpoints have no browser CORS). The
  // catalog resets whenever the key changes: carrying the previous
  // provider's list across a key swap would offer model ids the new key
  // cannot run. Selections are remembered per provider (models.svelte.ts),
  // so the swap itself can never leak the other provider's model id — which
  // lets a transient empty/failed catalog leave the preference untouched.
  let models = $state<ModelOption[]>([]);
  $effect(() => {
    const apiKey = modelKey.value;
    const provider = modelKey.provider;
    models = [];
    if (!apiKey || !provider) return;
    webModel.activateProvider(provider);
    let cancelled = false;
    void client
      .action(modelsApi.list, { apiKey, provider })
      .then((result) => {
        if (cancelled) return;
        models = result.models;
        // A saved model that left this provider's catalog would fail every
        // turn; fall back to the agent's configured default. Only a loaded
        // catalog is evidence of removal — an empty one is usually a
        // transient fetch failure and must not discard the preference.
        if (
          result.models.length > 0 &&
          !result.models.some((option) => option.id === webModel.selected) &&
          webModel.selected !== DEFAULT_MODEL_ID
        ) {
          webModel.select(DEFAULT_MODEL_ID);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  });

  /** The selected model rides along on every send as one-turn context. */
  function clientContext(): Record<string, unknown> {
    return { eveWebModel: webModel.selected };
  }

  const busy = $derived(
    agent.status === "submitted" || agent.status === "streaming",
  );
  const messages = $derived(agent.data.messages);

  // Attachment: re-runs on every messages/status change, keeping the
  // newest message in view as tokens stream in.
  function followTail(node: HTMLElement) {
    void messages;
    void agent.status;
    node.scrollTop = node.scrollHeight;
  }

  const suggestions = [
    "What can you do?",
    "Remember that I prefer short answers",
    "Remind me to stretch in 20 minutes",
    "What have I spent this month?",
  ];

  async function submit(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || busy) return;
    draft = "";
    try {
      await agent.send({ message, clientContext: clientContext() });
    } catch {
      // agent.error carries the failure; the banner below renders it.
    }
  }

  async function respond(requestId: string, optionId?: string, text?: string) {
    try {
      await agent.send({
        inputResponses: [
          {
            requestId,
            ...(optionId !== undefined ? { optionId } : {}),
            ...(text !== undefined ? { text } : {}),
          },
        ],
        clientContext: clientContext(),
      });
    } catch {
      // surfaced via agent.error
    }
  }

  function onComposerKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function inputRequestOf(
    part: EveDynamicToolPart,
  ): EveMessageInputRequest | undefined {
    return part.toolMetadata?.eve?.inputRequest;
  }

  function requestIdOf(part: EveDynamicToolPart): string | undefined {
    return (
      inputRequestOf(part)?.requestId ??
      (part.state === "approval-requested" ? part.approval.id : undefined)
    );
  }

  function prettyJson(value: unknown): string {
    if (value === undefined) return "";
    try {
      const text = JSON.stringify(value, null, 2);
      if (text === undefined) return "";
      return text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
    } catch {
      return String(value);
    }
  }

  function userText(message: EveMessage): string {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n\n");
  }
</script>

<section data-chat class="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
  <div
    class="flex min-h-0 flex-1 scroll-smooth flex-col overflow-y-auto"
    {@attach followTail}
  >
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
      {#if messages.length === 0}
        <div class="m-auto flex w-full max-w-md flex-col items-center gap-2.5 py-16 text-center">
          <h2 class="m-0 text-xl leading-[26px] font-semibold tracking-[-0.4px] text-gray-1000">
            {BRAND_NAME}
          </h2>
          <p class="m-0 text-sm leading-5 text-muted-foreground">
            Your durable personal assistant. Memory, reminders, webhooks and
            skills — everything persists.
          </p>
          <div class="mt-3 flex w-full max-w-sm flex-col gap-1.5">
            {#each suggestions as suggestion (suggestion)}
              <button
                class="cursor-pointer rounded-md border bg-transparent px-3.5 py-2 text-left text-[13px] text-muted-foreground transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100 hover:text-foreground"
                onclick={() => submit(suggestion)}
              >
                <span class="mr-2 font-mono text-gray-600" aria-hidden="true">→</span>{suggestion}
              </button>
            {/each}
          </div>
        </div>
      {:else}
        {#each messages as message (message.id)}
          {#if message.role === "user"}
            <div class="flex justify-end">
              <p
                class="m-0 max-w-[80%] rounded-2xl rounded-br-md bg-gray-200 px-4 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap text-foreground"
              >
                {userText(message)}
              </p>
            </div>
          {:else}
            <div class="flex flex-col gap-2">
              {#each message.parts as part, i (i)}
                {#if part.type === "text"}
                  {#if part.text.trim().length > 0}
                    <Markdown text={part.text} />
                  {/if}
                {:else if part.type === "reasoning"}
                  {#if part.text.trim().length > 0}
                    <details class="border-l-2 border-border pl-2.5 text-xs text-gray-600">
                      <summary
                        class="cursor-pointer text-[10px] font-semibold tracking-[0.08em] uppercase"
                      >
                        reasoning
                      </summary>
                      <p class="mt-1.5 mb-0 whitespace-pre-wrap">{part.text}</p>
                    </details>
                  {/if}
                {:else if part.type === "dynamic-tool"}
                  {#if part.state === "approval-requested"}
                    {@const request = inputRequestOf(part)}
                    {@const requestId = requestIdOf(part)}
                    <div
                      class="flex w-full max-w-[520px] flex-col gap-2 rounded-xl border border-alpha-600 bg-gray-100 px-4 py-3"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-semibold text-gray-1000">
                          {part.toolName}
                        </span>
                        <span
                          class="text-[10px] font-semibold tracking-[0.07em] text-amber-900 uppercase"
                        >
                          needs approval
                        </span>
                      </div>
                      {#if requestId}
                        <p class="m-0 text-sm text-foreground">
                          {request?.prompt ?? `Allow the agent to run ${part.toolName}?`}
                        </p>
                        <div class="flex flex-wrap gap-1.5">
                          {#if request?.options && request.options.length > 0}
                            {#each request.options as option (option.id)}
                              <Button
                                variant={option.style === "primary"
                                  ? "default"
                                  : option.style === "danger"
                                    ? "destructive"
                                    : "outline"}
                                size="sm"
                                class="rounded-full px-3"
                                onclick={() => respond(requestId, option.id)}
                              >
                                {option.label}
                              </Button>
                            {/each}
                          {:else}
                            <Button
                              size="sm"
                              class="rounded-full px-3"
                              onclick={() => respond(requestId, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              class="rounded-full px-3"
                              onclick={() => respond(requestId, "deny")}
                            >
                              Deny
                            </Button>
                          {/if}
                        </div>
                        {#if request?.allowFreeform || request?.display === "text"}
                          <form
                            class="flex gap-1.5"
                            onsubmit={(e) => {
                              e.preventDefault();
                              const text = hitlText[requestId]?.trim();
                              if (text) void respond(requestId, undefined, text);
                            }}
                          >
                            <input
                              class="h-8 min-w-0 flex-1 rounded-full border bg-background px-3 text-xs text-foreground transition-colors duration-150 outline-none placeholder:text-muted-foreground hover:border-alpha-500"
                              placeholder="Or type a response…"
                              bind:value={hitlText[requestId]}
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              class="rounded-full px-3"
                            >
                              Send
                            </Button>
                          </form>
                        {/if}
                      {/if}
                    </div>
                  {:else}
                    <details class="group w-fit max-w-full">
                      <summary
                        class="flex w-fit cursor-pointer items-center gap-2 rounded-full border bg-gray-100 py-1 pr-3 pl-2.5 text-xs text-gray-600 transition-colors duration-150 hover:border-alpha-500 hover:text-foreground"
                      >
                        <span aria-hidden="true">⚙</span>
                        <span class="font-mono">{part.toolName}</span>
                        <span
                          class="text-[10px] tracking-[0.05em] uppercase {part.state ===
                          'output-error'
                            ? 'text-red-900'
                            : part.state === 'output-available'
                              ? 'text-green-900'
                              : ''}"
                        >
                          {part.state === "output-available"
                            ? "done"
                            : part.state.replace(/-/g, " ")}
                        </span>
                      </summary>
                      <div
                        class="mt-1.5 flex max-w-[520px] flex-col gap-1.5 rounded-xl border bg-gray-100 px-3 py-2.5"
                      >
                        {#if part.input !== undefined && prettyJson(part.input)}
                          <span class="text-[10px] font-medium tracking-wide text-gray-600 uppercase">
                            input
                          </span>
                          <pre
                            class="m-0 max-h-48 overflow-auto rounded-md border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-words whitespace-pre-wrap text-muted-foreground">{prettyJson(
                              part.input,
                            )}</pre>
                        {/if}
                        {#if part.state === "output-available" && prettyJson(part.output)}
                          <span class="text-[10px] font-medium tracking-wide text-gray-600 uppercase">
                            output
                          </span>
                          <pre
                            class="m-0 max-h-48 overflow-auto rounded-md border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-words whitespace-pre-wrap text-green-900">{prettyJson(
                              part.output,
                            )}</pre>
                        {/if}
                        {#if part.state === "output-error"}
                          <pre
                            class="m-0 max-h-48 overflow-auto rounded-md border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-words whitespace-pre-wrap text-red-900">{part.errorText}</pre>
                        {/if}
                        {#if part.state === "output-denied"}
                          <pre
                            class="m-0 rounded-md border bg-gray-200 px-2 py-1.5 font-mono text-[11px] text-red-900">denied by user</pre>
                        {/if}
                      </div>
                    </details>
                  {/if}
                {:else if part.type === "authorization"}
                  <div
                    class="flex w-full max-w-[520px] flex-col gap-1.5 rounded-xl border bg-gray-100 px-4 py-3"
                  >
                    <div class="flex items-center justify-between gap-2.5">
                      <span class="font-mono text-xs font-semibold text-gray-1000">
                        {part.displayName}
                      </span>
                      <span class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase">
                        {part.state}
                      </span>
                    </div>
                    {#if part.state === "required" && part.authorization?.url}
                      <a
                        class="text-xs text-blue-900 underline-offset-4 hover:underline"
                        href={part.authorization.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Authorize {part.displayName}
                        {#if part.authorization.userCode}
                          · code <code class="font-mono">{part.authorization.userCode}</code>
                        {/if}
                      </a>
                    {/if}
                  </div>
                {/if}
              {/each}
              {#if message.metadata?.status === "streaming"}
                <span class="size-1.5 animate-pulse rounded-full bg-green-900"></span>
              {/if}
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>

  {#if agent.error}
    <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
      <div
        class="flex items-center justify-between gap-3 rounded-md border border-red-400 bg-red-100 px-3 py-2 text-xs text-red-900"
      >
        <span class="min-w-0 break-words">{agent.error}</span>
        <Button
          variant="outline"
          size="sm"
          class="shrink-0 border-red-400 text-red-900 hover:bg-red-200"
          onclick={() => agent.reset()}
        >
          New Session
        </Button>
      </div>
    </div>
  {/if}

  <footer class="shrink-0 px-4 pt-2 pb-4 md:px-6">
    <div
      class="mx-auto flex w-full max-w-3xl flex-col gap-1.5 rounded-xl border bg-gray-100/60 px-3 pt-2.5 pb-2 transition-colors duration-150 focus-within:border-alpha-600"
    >
      <textarea
        class="max-h-40 min-h-[44px] w-full resize-none border-0 bg-transparent px-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        placeholder={busy ? "Agent is working…" : `Message ${BRAND_NAME}…`}
        bind:value={draft}
        onkeydown={onComposerKeydown}
        rows={1}
      ></textarea>
      <div class="flex items-center justify-between gap-2">
        <ModelPicker {models} />
        <div class="flex items-center gap-2">
          <span
            class="font-mono text-[11px] {busy ? 'text-amber-900' : 'text-gray-600'}"
          >
            {#if busy}<span class="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-current"></span>{/if}
            {agent.status}
          </span>
          <button
            class="flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-primary text-primary-foreground transition-opacity disabled:cursor-default disabled:opacity-40"
            title="Send"
            aria-label="Send message"
            disabled={busy || draft.trim().length === 0}
            onclick={() => submit()}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  </footer>
</section>
