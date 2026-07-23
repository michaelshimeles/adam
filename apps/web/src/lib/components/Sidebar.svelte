<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { BRAND_NAME } from "../brand";
  import { timeAgo } from "../format";
  import { getNow } from "../now.svelte";
  import type { ThreadMeta, ThreadSection } from "../threads.svelte";

  let {
    sections,
    activeId,
    activeInboxSessionId,
    onSelect,
    onSelectInbox,
    onNew,
    onRename,
    onTogglePin,
    onDelete,
    onClose,
  }: {
    sections: (query: string) => ThreadSection[];
    activeId: string;
    activeInboxSessionId: string | null;
    onSelect: (id: string) => void;
    onSelectInbox: (sessionId: string, title: string) => void;
    onNew: () => void;
    onRename: (id: string, title: string) => void;
    onTogglePin: (thread: ThreadMeta) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
  } = $props();

  const inbox = useQuery(api.inboxList, { limit: 30 });

  let query = $state("");
  let editingId = $state<string | null>(null);
  let editTitle = $state("");

  const grouped = $derived(sections(query));

  function startRename(thread: ThreadMeta) {
    editingId = thread.id;
    editTitle = thread.title;
  }

  function commitRename() {
    if (editingId && editTitle.trim()) onRename(editingId, editTitle.trim());
    editingId = null;
  }
</script>

<aside
  class="flex h-full w-72 shrink-0 flex-col border-r bg-gray-100/40"
  aria-label="Chat threads"
>
  <div class="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
    <span class="flex items-baseline gap-2 pl-1 text-sm font-semibold tracking-[-0.28px]">
      <span aria-hidden="true">▲</span>
      {BRAND_NAME}
    </span>
    <button
      class="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 font-mono text-[11px] text-gray-600 hover:bg-gray-200 hover:text-foreground"
      title="Hide sidebar"
      aria-label="Hide sidebar"
      onclick={onClose}
    >
      ⟨⟨
    </button>
  </div>

  <div class="flex flex-col gap-2 px-3 pb-2">
    <button
      class="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-[13px] text-foreground transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100"
      onclick={onNew}
    >
      <span class="font-mono text-gray-600" aria-hidden="true">+</span> New chat
    </button>
    <input
      class="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground hover:border-alpha-500 focus:border-alpha-600"
      placeholder="Search chats…"
      bind:value={query}
    />
  </div>

  <nav class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
    {#each grouped as section (section.label ?? "search")}
      <div class="flex flex-col gap-0.5">
        {#if section.label}
          <span
            class="px-1.5 pt-1 pb-1 font-mono text-[10px] font-medium tracking-[0.1em] text-gray-600 uppercase"
          >
            {section.label}
          </span>
        {/if}
        {#each section.threads as thread (thread.id)}
          {#if editingId === thread.id}
            <form
              class="px-1 py-0.5"
              onsubmit={(e) => {
                e.preventDefault();
                commitRename();
              }}
            >
              <!-- svelte-ignore a11y_autofocus -->
              <input
                class="w-full rounded-md border bg-background px-2 py-1.5 text-[13px] outline-none"
                bind:value={editTitle}
                autofocus
                onblur={commitRename}
              />
            </form>
          {:else}
            <div
              class="group flex items-center rounded-md {thread.id === activeId &&
              activeInboxSessionId === null
                ? 'bg-gray-200'
                : 'hover:bg-gray-200/60'}"
            >
              <button
                class="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 bg-transparent px-2.5 py-2 text-left"
                onclick={() => onSelect(thread.id)}
              >
                <span class="flex items-center gap-1.5 truncate text-[13px] text-foreground">
                  {#if thread.pinned}<span class="text-gray-600" aria-hidden="true">⤒</span>{/if}
                  <span class="truncate">{thread.title}</span>
                </span>
                <span class="font-mono text-[10px] text-gray-600">
                  {timeAgo(thread.updatedAt, getNow())}
                </span>
              </button>
              <div class="hidden shrink-0 items-center gap-0.5 pr-1.5 group-hover:flex">
                <button
                  class="cursor-pointer rounded border-0 bg-transparent px-1 py-0.5 text-[11px] text-gray-600 hover:text-foreground"
                  title={thread.pinned ? "Unpin" : "Pin"}
                  aria-label={thread.pinned ? "Unpin thread" : "Pin thread"}
                  onclick={() => onTogglePin(thread)}
                >
                  ⤒
                </button>
                <button
                  class="cursor-pointer rounded border-0 bg-transparent px-1 py-0.5 text-[11px] text-gray-600 hover:text-foreground"
                  title="Rename"
                  aria-label="Rename thread"
                  onclick={() => startRename(thread)}
                >
                  ✎
                </button>
                <button
                  class="cursor-pointer rounded border-0 bg-transparent px-1 py-0.5 text-[11px] text-gray-600 hover:text-red-900"
                  title="Delete"
                  aria-label="Delete thread"
                  onclick={() => onDelete(thread.id)}
                >
                  ×
                </button>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/each}

    {#if !inbox.isLoading && !inbox.error && inbox.data.length > 0}
      <div class="flex flex-col gap-0.5">
        <span
          class="px-1.5 pt-1 pb-1 font-mono text-[10px] font-medium tracking-[0.1em] text-gray-600 uppercase"
          title="Sessions the agent started on its own — reminders and webhook events"
        >
          Agent-initiated
        </span>
        {#each inbox.data as item (item.sessionId)}
          <button
            class="flex min-w-0 cursor-pointer flex-col gap-0.5 rounded-md px-2.5 py-2 text-left {item.sessionId ===
            activeInboxSessionId
              ? 'bg-gray-200'
              : 'hover:bg-gray-200/60'}"
            onclick={() => onSelectInbox(item.sessionId, item.title)}
          >
            <span class="truncate text-[13px] text-foreground">{item.title}</span>
            <span class="flex items-center gap-2 font-mono text-[10px] text-gray-600">
              <span class="rounded border px-1 uppercase">{item.kind}</span>
              <span>{timeAgo(item.createdAt, getNow())}</span>
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </nav>
</aside>
