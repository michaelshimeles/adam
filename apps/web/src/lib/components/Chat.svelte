<script lang="ts">
  import type {
    EveDynamicToolPart,
    EveMessage,
    EveMessageInputRequest,
  } from "eve/client";
  import { createChatSession } from "../chat.svelte";

  // Convex-native chat: sends go through the chat:send action and the
  // transcript is a reactive Convex query over the session's event stream.
  const agent = createChatSession();

  let draft = $state("");
  let hitlText = $state<Record<string, string>>({});
  let scroller = $state<HTMLDivElement | null>(null);

  const busy = $derived(
    agent.status === "submitted" || agent.status === "streaming",
  );
  const messages = $derived(agent.data.messages);

  // Keep the newest message in view as tokens stream in.
  $effect(() => {
    void messages;
    void agent.status;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });

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

<section class="chat">
  <div class="messages" bind:this={scroller}>
    {#if messages.length === 0}
      <div class="welcome">
        <div class="glyph">◆</div>
        <h2>Talk to your durable agent</h2>
        <p>
          Every turn becomes a workflow run persisted in Convex — steps, retries,
          human-in-the-loop approvals, and token streams all land in the tables
          on the right.
        </p>
        <div class="suggestions">
          {#each suggestions as suggestion (suggestion)}
            <button class="suggestion" onclick={() => submit(suggestion)}>
              {suggestion}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      {#each messages as message (message.id)}
        <article class="message {message.role}">
          <div class="role">
            {roleLabel(message)}
            {#if message.metadata?.status === "streaming"}
              <span class="streaming-dot"></span>
            {/if}
          </div>
          <div class="parts">
            {#each message.parts as part, i (i)}
              {#if part.type === "text"}
                <p class="text">{part.text}</p>
              {:else if part.type === "reasoning"}
                {#if part.text.trim().length > 0}
                  <details class="reasoning">
                    <summary>reasoning</summary>
                    <p>{part.text}</p>
                  </details>
                {/if}
              {:else if part.type === "dynamic-tool"}
                <div class="tool" data-state={part.state}>
                  <div class="tool-head">
                    <span class="tool-name">{part.toolName}</span>
                    <span class="tool-state">{part.state.replace(/-/g, " ")}</span>
                  </div>
                  {#if part.input !== undefined && compactJson(part.input)}
                    <code class="tool-io">{compactJson(part.input)}</code>
                  {/if}
                  {#if part.state === "output-available" && compactJson(part.output)}
                    <code class="tool-io out">{compactJson(part.output)}</code>
                  {/if}
                  {#if part.state === "output-error"}
                    <code class="tool-io err">{part.errorText}</code>
                  {/if}
                  {#if part.state === "output-denied"}
                    <code class="tool-io err">denied by user</code>
                  {/if}

                  {#if part.state === "approval-requested"}
                    {@const request = inputRequestOf(part)}
                    {@const requestId = requestIdOf(part)}
                    {#if requestId}
                      <div class="hitl">
                        <p class="hitl-prompt">
                          {request?.prompt ??
                            `Allow the agent to run ${part.toolName}?`}
                        </p>
                        <div class="hitl-actions">
                          {#if request?.options && request.options.length > 0}
                            {#each request.options as option (option.id)}
                              <button
                                class="hitl-btn {option.style ?? 'default'}"
                                onclick={() => respond(requestId, option.id)}
                              >
                                {option.label}
                              </button>
                            {/each}
                          {:else}
                            <button
                              class="hitl-btn primary"
                              onclick={() => respond(requestId, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              class="hitl-btn danger"
                              onclick={() => respond(requestId, "deny")}
                            >
                              Deny
                            </button>
                          {/if}
                        </div>
                        {#if request?.allowFreeform || request?.display === "text"}
                          <form
                            class="hitl-freeform"
                            onsubmit={(e) => {
                              e.preventDefault();
                              const text = hitlText[requestId]?.trim();
                              if (text) void respond(requestId, undefined, text);
                            }}
                          >
                            <input
                              placeholder="Or type a response…"
                              bind:value={hitlText[requestId]}
                            />
                            <button type="submit" class="hitl-btn default">
                              Send
                            </button>
                          </form>
                        {/if}
                      </div>
                    {/if}
                  {/if}
                </div>
              {:else if part.type === "authorization"}
                <div class="tool">
                  <div class="tool-head">
                    <span class="tool-name">{part.displayName}</span>
                    <span class="tool-state">{part.state}</span>
                  </div>
                  {#if part.state === "required" && part.authorization?.url}
                    <a
                      class="auth-link"
                      href={part.authorization.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Authorize {part.displayName}
                      {#if part.authorization.userCode}
                        · code <code>{part.authorization.userCode}</code>
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
    <div class="error-banner">
      {agent.error}
      <button onclick={() => agent.reset()}>new session</button>
    </div>
  {/if}

  <footer class="composer">
    <textarea
      placeholder={busy ? "Agent is working…" : "Message the agent…"}
      bind:value={draft}
      onkeydown={onComposerKeydown}
      rows="1"
    ></textarea>
    <div class="composer-actions">
      {#if !busy && messages.length > 0}
        <button class="btn ghost" onclick={() => agent.reset()}>New chat</button>
      {/if}
      <button
        class="btn primary"
        disabled={busy || draft.trim().length === 0}
        onclick={() => submit()}
      >
        Send
      </button>
    </div>
  </footer>

  <div class="statusline">
    <span class="status-{agent.status}">{agent.status}</span>
    {#if agent.sessionId}
      <span class="mono">session {agent.sessionId.slice(0, 16)}…</span>
    {/if}
    <span class="mono dim">runtime: convex node action</span>
  </div>
</section>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--panel);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 0;
    scroll-behavior: smooth;
  }

  .welcome {
    margin: auto;
    max-width: 430px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px 0;
  }

  .glyph {
    font-size: 26px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .welcome h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: #fff;
  }

  .welcome p {
    margin: 0;
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.55;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 10px;
  }

  .suggestion {
    background: #0d0d10;
    color: var(--text-dim);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 12.5px;
    cursor: pointer;
    transition:
      color 120ms ease,
      border-color 120ms ease,
      background 120ms ease;
  }

  .suggestion:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.3);
    background: #101014;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 86%;
  }

  .message.user {
    align-self: flex-end;
    align-items: flex-end;
  }

  .message.assistant {
    align-self: flex-start;
    align-items: flex-start;
  }

  .role {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-faint);
  }

  .streaming-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 1.4s ease-in-out infinite;
  }

  .parts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  .message.user .parts {
    align-items: flex-end;
  }

  .text {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    width: fit-content;
    max-width: 100%;
  }

  .message.assistant .text {
    background: #141419;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top-left-radius: 4px;
  }

  .message.user .text {
    background: #fff;
    border: 1px solid #fff;
    color: #0a0a0c;
    border-top-right-radius: 4px;
  }

  .reasoning {
    font-size: 12px;
    color: var(--text-faint);
    background: transparent;
    border-left: 2px solid var(--border);
    padding-left: 10px;
  }

  .reasoning summary {
    cursor: pointer;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .reasoning p {
    margin: 6px 0 0;
    white-space: pre-wrap;
  }

  .tool {
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 9px 12px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    width: 100%;
    max-width: 460px;
  }

  .tool[data-state="approval-requested"] {
    border-color: rgba(255, 255, 255, 0.28);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .tool-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .tool-name {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ededf0;
  }

  .tool-state {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-faint);
    font-weight: 700;
  }

  .tool-io {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    background: #141419;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 6px 8px;
    border-radius: 6px;
    word-break: break-all;
    white-space: pre-wrap;
  }

  .tool-io.out {
    color: var(--green);
  }

  .tool-io.err {
    color: var(--red);
  }

  .hitl {
    border-top: 1px dashed var(--border);
    padding-top: 9px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .hitl-prompt {
    margin: 0;
    font-size: 13px;
    color: var(--text);
  }

  .hitl-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .hitl-btn {
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: transparent;
    color: #c8c8ce;
    transition:
      border-color 0.15s,
      color 0.15s;
  }

  .hitl-btn:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .hitl-btn.primary {
    background: #fff;
    border-color: #fff;
    color: #0a0a0c;
    transition:
      transform 0.12s,
      box-shadow 0.12s;
  }

  .hitl-btn.primary:hover {
    color: #0a0a0c;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.18);
  }

  .hitl-btn.danger {
    background: rgba(255, 98, 112, 0.12);
    border-color: rgba(255, 98, 112, 0.4);
    color: var(--red);
  }

  .hitl-btn.danger:hover {
    border-color: rgba(255, 98, 112, 0.7);
    color: var(--red);
  }

  .hitl-freeform {
    display: flex;
    gap: 7px;
  }

  .hitl-freeform input {
    flex: 1;
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    color: var(--text);
    padding: 6px 12px;
    font-size: 12.5px;
    font-family: inherit;
  }

  .hitl-freeform input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .auth-link {
    color: var(--blue);
    font-size: 12.5px;
  }

  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 16px;
    padding: 9px 13px;
    background: rgba(255, 98, 112, 0.08);
    border: 1px solid rgba(255, 98, 112, 0.35);
    border-radius: var(--radius-sm);
    color: var(--red);
    font-size: 12.5px;
  }

  .error-banner button {
    background: transparent;
    border: 1px solid rgba(255, 98, 112, 0.45);
    color: var(--red);
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 11.5px;
    cursor: pointer;
    white-space: nowrap;
  }

  .composer {
    display: flex;
    gap: 10px;
    padding: 14px 16px 10px;
    border-top: 1px solid var(--border-soft);
    align-items: flex-end;
  }

  textarea {
    flex: 1;
    resize: none;
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    color: var(--text);
    font-family: inherit;
    font-size: 13.5px;
    line-height: 1.5;
    padding: 10px 13px;
    min-height: 42px;
    max-height: 140px;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  textarea:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: #101014;
  }

  .composer-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    border-radius: 999px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn.primary {
    background: #fff;
    color: #0a0a0c;
    transition:
      transform 0.12s,
      box-shadow 0.12s;
  }

  .btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.18);
  }

  .btn.primary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn.ghost {
    background: transparent;
    color: #c8c8ce;
    border-color: rgba(255, 255, 255, 0.16);
    transition:
      border-color 0.15s,
      color 0.15s;
  }

  .btn.ghost:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .statusline {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 0 18px 10px;
    font-size: 11px;
    color: var(--text-faint);
  }

  .statusline .mono {
    font-family: var(--mono);
  }

  .statusline .dim {
    margin-left: auto;
    opacity: 0.75;
  }

  .status-streaming {
    color: var(--green);
  }

  .status-submitted {
    color: var(--amber);
  }

  .status-error {
    color: var(--red);
  }

  @media (max-width: 640px) {
    .messages {
      padding: 14px;
      gap: 14px;
    }

    .message {
      max-width: 94%;
    }

    .composer {
      padding: 10px 12px 8px;
      gap: 8px;
    }

    textarea {
      /* 16px stops iOS Safari from zooming the page on focus. */
      font-size: 16px;
    }

    .btn {
      padding: 10px 16px;
    }

    .statusline {
      padding: 0 12px 8px;
      gap: 10px;
    }

    .statusline .mono:not(.dim) {
      display: none;
    }
  }
</style>
