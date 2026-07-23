<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import {
    defaultMessageReducer,
    type EveMessage,
    type HandleMessageStreamEvent,
  } from "eve/client";
  import { chatApi, parseSessionEvents, type SessionEventsPage } from "../api";
  import Markdown from "./Markdown.svelte";

  /**
   * Read-only transcript of a proactive session (fired reminder or webhook
   * event) — the agent started it on its own, so there is no continuation
   * token to reply with.
   */

  let { sessionId, title }: { sessionId: string; title: string } = $props();

  const client = useConvexClient();

  let events = $state<HandleMessageStreamEvent[]>([]);
  let error = $state<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  const reducer = defaultMessageReducer();
  const messages = $derived.by<readonly EveMessage[]>(() => {
    let acc = reducer.initial();
    for (const event of events) acc = reducer.reduce(acc, event);
    return acc.messages;
  });

  $effect(() => {
    const id = sessionId;
    events = [];
    error = null;
    unsubscribe?.();
    unsubscribe = client.onUpdate(
      chatApi.sessionEvents,
      { sessionId: id },
      (page: SessionEventsPage | null) => {
        if (page) events = parseSessionEvents(page) as HandleMessageStreamEvent[];
      },
      (err) => {
        error = err.message;
      },
    );
    return () => unsubscribe?.();
  });

  function messageText(message: EveMessage): string {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n\n");
  }
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
    <div class="flex flex-col gap-1 border-b pb-4">
      <h2 class="m-0 text-base font-semibold text-foreground">{title}</h2>
      <p class="m-0 text-xs text-muted-foreground">
        Agent-initiated session — read-only transcript.
      </p>
    </div>

    {#if error}
      <p class="m-0 text-xs text-red-900">{error}</p>
    {:else if messages.length === 0}
      <p class="m-0 text-xs text-muted-foreground">Loading transcript…</p>
    {:else}
      {#each messages as message, i (i)}
        {@const text = messageText(message)}
        {#if text.trim()}
          {#if message.role === "user"}
            <div class="flex flex-col gap-1">
              <span class="font-mono text-[10px] font-medium tracking-[0.06em] text-gray-600 uppercase">
                event
              </span>
              <p
                class="m-0 w-fit max-w-full rounded-xl border bg-gray-100 px-3.5 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap text-muted-foreground"
              >
                {text}
              </p>
            </div>
          {:else}
            <Markdown {text} />
          {/if}
        {/if}
      {/each}
    {/if}
  </div>
</section>
