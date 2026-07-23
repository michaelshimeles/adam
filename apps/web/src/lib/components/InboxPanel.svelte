<script lang="ts">
  import { useConvexClient, useQuery } from "convex-svelte";
  import {
    defaultMessageReducer,
    type EveMessage,
    type HandleMessageStreamEvent,
  } from "eve/client";
  import { api, chatApi, parseSessionEvents, type SessionEventsPage } from "../api";
  import { timeAgo } from "../format";
  import { getNow } from "../now.svelte";

  /**
   * Proactive inbox: sessions the agent started on its own (fired reminders,
   * webhook events). Rows come from inbox:list; a row expands into the
   * session's transcript via the same ui:sessionEvents stream the chat uses.
   */

  const client = useConvexClient();
  const inbox = useQuery(api.inboxList, { limit: 50 });

  let openSessionId = $state<string | null>(null);
  let events = $state<HandleMessageStreamEvent[]>([]);
  let transcriptError = $state<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  const reducer = defaultMessageReducer();
  const messages = $derived.by<readonly EveMessage[]>(() => {
    let acc = reducer.initial();
    for (const event of events) acc = reducer.reduce(acc, event);
    return acc.messages;
  });

  function toggle(sessionId: string) {
    unsubscribe?.();
    unsubscribe = null;
    events = [];
    transcriptError = null;
    if (openSessionId === sessionId) {
      openSessionId = null;
      return;
    }
    openSessionId = sessionId;
    unsubscribe = client.onUpdate(
      chatApi.sessionEvents,
      { sessionId },
      (page: SessionEventsPage | null) => {
        if (page) events = parseSessionEvents(page) as HandleMessageStreamEvent[];
      },
      (err) => {
        transcriptError = err.message;
      },
    );
  }

  function messageText(message: EveMessage): string {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
  }

  $effect(() => () => unsubscribe?.());
</script>

<section class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
  <header class="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b px-4">
    <h2 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
      Agent Inbox
    </h2>
    <span
      class="inline-flex items-center gap-1.5 font-mono text-[11px] text-green-900"
      title="Sessions the agent started on its own — reminders and webhook events"
    >
      <span class="size-1.5 animate-pulse rounded-full bg-current"></span> live
    </span>
  </header>

  {#if inbox.isLoading}
    <div class="px-4 py-5 text-center text-xs text-muted-foreground">Loading…</div>
  {:else if inbox.error}
    <div class="px-4 py-5 text-center text-xs text-red-900">
      Can't reach Convex: {inbox.error.message}
    </div>
  {:else if inbox.data.length === 0}
    <div class="px-4 py-5 text-xs leading-5 text-muted-foreground">
      Nothing yet. When a reminder fires or a webhook event arrives, the
      agent's proactive session appears here.
    </div>
  {:else}
    <ul class="m-0 flex min-h-0 list-none flex-col divide-y overflow-y-auto p-0">
      {#each inbox.data as item (item.sessionId)}
        <li>
          <button
            class="flex w-full cursor-pointer items-start justify-between gap-2 bg-transparent px-4 py-3 text-left hover:bg-gray-100/60"
            onclick={() => toggle(item.sessionId)}
          >
            <span class="min-w-0">
              <span class="block truncate text-[13px] leading-[18px]">{item.title}</span>
              <span class="mt-1 flex items-center gap-2 font-mono text-[11px] text-gray-600">
                <span class="rounded border px-1 uppercase">{item.kind}</span>
                <span>{timeAgo(item.createdAt, getNow())}</span>
              </span>
            </span>
            <span class="shrink-0 font-mono text-[11px] text-gray-600">
              {openSessionId === item.sessionId ? "−" : "+"}
            </span>
          </button>
          {#if openSessionId === item.sessionId}
            <div class="flex flex-col gap-2.5 border-t bg-gray-100/40 px-4 py-3">
              {#if transcriptError}
                <p class="m-0 text-xs text-red-900">{transcriptError}</p>
              {:else if messages.length === 0}
                <p class="m-0 text-xs text-muted-foreground">Loading transcript…</p>
              {:else}
                {#each messages as message, i (i)}
                  {@const text = messageText(message)}
                  {#if text.trim()}
                    <div>
                      <span class="font-mono text-[10px] font-medium tracking-[0.06em] text-gray-600 uppercase">
                        {message.role === "user" ? "event" : "agent"}
                      </span>
                      <p class="m-0 mt-0.5 text-[13px] leading-[18px] break-words whitespace-pre-wrap">
                        {text}
                      </p>
                    </div>
                  {/if}
                {/each}
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
