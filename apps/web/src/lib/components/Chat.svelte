<script lang="ts">
  import type {
    EveDynamicToolPart,
    EveMessage,
    EveMessageInputRequest,
  } from "eve/client";
  import { createChatSession } from "../chat.svelte";
  import { Button } from "ui/components/button";
  import { Textarea } from "ui/components/textarea";

  // Convex-native chat: sends go through the chat:send action and the
  // transcript is a reactive Convex query over the session's event stream.
  const agent = createChatSession();

  let draft = $state("");
  let hitlText = $state<Record<string, string>>({});

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
    "Save a note: eve is running on Convex end to end",
    "What's on the notepad right now?",
    "How healthy is the workflow queue?",
    "Clear the notepad",
  ];

  async function submit(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || busy) return;
    draft = "";
    try {
      await agent.send({ message });
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

  function compactJson(value: unknown): string {
    if (value === undefined) return "";
    try {
      const text = JSON.stringify(value);
      if (text === undefined) return "";
      return text.length > 220 ? `${text.slice(0, 220)}…` : text;
    } catch {
      return String(value);
    }
  }

  function roleLabel(message: EveMessage): string {
    return message.role === "user" ? "you" : "agent";
  }
</script>

<section
  data-chat
  class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background"
>
  <header class="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b px-4">
    <h2 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
      Agent Session
    </h2>
    <div class="flex min-w-0 items-center gap-3 font-mono text-[11px] text-gray-600">
      {#if agent.sessionId}
        <span class="hidden truncate md:inline">{agent.sessionId.slice(0, 16)}…</span>
      {/if}
      <span
        class="inline-flex shrink-0 items-center gap-1.5 {agent.status === 'streaming'
          ? 'text-green-900'
          : agent.status === 'submitted'
            ? 'text-amber-900'
            : agent.status === 'error'
              ? 'text-red-900'
              : ''}"
      >
        {#if busy}
          <span class="size-1.5 animate-pulse rounded-full bg-current"></span>
        {/if}
        {agent.status}
      </span>
    </div>
  </header>

  <div
    class="flex min-h-0 flex-1 scroll-smooth flex-col gap-4 overflow-y-auto p-3.5 md:gap-5 md:p-5"
    {@attach followTail}
  >
    {#if messages.length === 0}
      <div class="m-auto flex w-full max-w-md flex-col items-center gap-2.5 py-10 text-center">
        <p class="m-0 font-mono text-[11px] font-medium tracking-[0.12em] text-gray-600 uppercase">
          every turn is a workflow run
        </p>
        <h2 class="m-0 text-xl leading-[26px] font-semibold tracking-[-0.4px] text-gray-1000">
          Talk to your durable agent
        </h2>
        <p class="m-0 text-sm leading-5 text-muted-foreground">
          Steps, retries, human-in-the-loop approvals, and token streams all
          land in the panels on the right — live from Convex.
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
        <article
          class="flex max-w-[86%] flex-col gap-1.5 {message.role === 'user'
            ? 'items-end self-end'
            : 'items-start self-start'}"
        >
          <div
            class="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-gray-600 uppercase"
          >
            {roleLabel(message)}
            {#if message.metadata?.status === "streaming"}
              <span class="size-1.5 animate-pulse rounded-full bg-green-900"></span>
            {/if}
          </div>
          <div
            class="flex w-full min-w-0 flex-col gap-2 {message.role === 'user'
              ? 'items-end'
              : ''}"
          >
            {#each message.parts as part, i (i)}
              {#if part.type === "text"}
                <p
                  class="m-0 w-fit max-w-full rounded-md px-3.5 py-2.5 text-sm leading-5 break-words whitespace-pre-wrap {message.role ===
                  'user'
                    ? 'rounded-tr-sm bg-primary text-primary-foreground'
                    : 'rounded-tl-sm border bg-gray-100 text-foreground'}"
                >
                  {part.text}
                </p>
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
                <div
                  class="flex w-full max-w-[460px] flex-col gap-1.5 rounded-md border bg-gray-100 px-3 py-2.5 {part.state ===
                  'approval-requested'
                    ? 'border-alpha-600'
                    : ''}"
                >
                  <div class="flex items-center justify-between gap-2.5">
                    <span
                      class="font-mono text-xs font-semibold tracking-[0.06em] text-gray-1000 uppercase"
                    >
                      {part.toolName}
                    </span>
                    <span
                      class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase"
                    >
                      {part.state.replace(/-/g, " ")}
                    </span>
                  </div>
                  {#if part.input !== undefined && compactJson(part.input)}
                    <code
                      class="rounded-sm border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-all whitespace-pre-wrap text-muted-foreground"
                    >
                      {compactJson(part.input)}
                    </code>
                  {/if}
                  {#if part.state === "output-available" && compactJson(part.output)}
                    <code
                      class="rounded-sm border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-all whitespace-pre-wrap text-green-900"
                    >
                      {compactJson(part.output)}
                    </code>
                  {/if}
                  {#if part.state === "output-error"}
                    <code
                      class="rounded-sm border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-all whitespace-pre-wrap text-red-900"
                    >
                      {part.errorText}
                    </code>
                  {/if}
                  {#if part.state === "output-denied"}
                    <code
                      class="rounded-sm border bg-gray-200 px-2 py-1.5 font-mono text-[11px] break-all whitespace-pre-wrap text-red-900"
                    >
                      denied by user
                    </code>
                  {/if}

                  {#if part.state === "approval-requested"}
                    {@const request = inputRequestOf(part)}
                    {@const requestId = requestIdOf(part)}
                    {#if requestId}
                      <div class="flex flex-col gap-2 border-t border-dashed pt-2">
                        <p class="m-0 text-sm text-foreground">
                          {request?.prompt ??
                            `Allow the agent to run ${part.toolName}?`}
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
                      </div>
                    {/if}
                  {/if}
                </div>
              {:else if part.type === "authorization"}
                <div
                  class="flex w-full max-w-[460px] flex-col gap-1.5 rounded-md border bg-gray-100 px-3 py-2.5"
                >
                  <div class="flex items-center justify-between gap-2.5">
                    <span
                      class="font-mono text-xs font-semibold tracking-[0.06em] text-gray-1000 uppercase"
                    >
                      {part.displayName}
                    </span>
                    <span
                      class="text-[10px] font-semibold tracking-[0.07em] text-gray-600 uppercase"
                    >
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
          </div>
        </article>
      {/each}
    {/if}
  </div>

  {#if agent.error}
    <div
      class="mx-3.5 flex items-center justify-between gap-3 rounded-md border border-red-400 bg-red-100 px-3 py-2 text-xs text-red-900 md:mx-4"
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
  {/if}

  <footer class="flex items-end gap-2.5 border-t p-3 md:px-4 md:pt-3.5 md:pb-3.5">
    <Textarea
      class="max-h-36 min-h-10 flex-1 text-sm md:text-sm"
      placeholder={busy ? "Agent is working…" : "Message the agent…"}
      bind:value={draft}
      onkeydown={onComposerKeydown}
      rows={1}
    />
    <div class="flex gap-2">
      {#if !busy && messages.length > 0}
        <Button variant="ghost" onclick={() => agent.reset()}>New Chat</Button>
      {/if}
      <Button disabled={busy || draft.trim().length === 0} onclick={() => submit()}>
        Send
      </Button>
    </div>
  </footer>
</section>
