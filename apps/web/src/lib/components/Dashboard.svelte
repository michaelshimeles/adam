<script lang="ts">
  import { modelKey } from "../apiKey.svelte";
  import { BRAND_NAME, IS_AGENT_APP } from "../brand";
  import { createChatSession } from "../chat.svelte";
  import { createThreadStore, toThreadTitle, type ThreadMeta } from "../threads.svelte";
  import ApiKeyDialog from "./ApiKeyDialog.svelte";
  import Chat from "./Chat.svelte";
  import InboxTranscript from "./InboxTranscript.svelte";
  import SettingsView from "./SettingsView.svelte";
  import Sidebar from "./Sidebar.svelte";

  const threads = createThreadStore();
  const agent = createChatSession({
    onSessionChange: (session) => {
      threads.update(threads.activeId, {
        sessionId: session.sessionId,
        continuationToken: session.continuationToken,
        updatedAt: Date.now(),
      });
    },
  });

  let sidebarOpen = $state(window.innerWidth >= 768);
  let keyDialogOpen = $state(false);
  let view = $state<"chat" | "settings">("chat");
  let inboxSelection = $state<{ sessionId: string; title: string } | null>(null);

  // BYOK gate: no key yet → the dialog blocks the dashboard.
  const keyRequired = $derived(modelKey.value === null);

  // Point the chat at the active thread's session whenever it changes.
  let activatedThreadId: string | null = null;
  $effect(() => {
    const active = threads.active;
    if (active.id === activatedThreadId) return;
    activatedThreadId = active.id;
    agent.activate(
      active.sessionId
        ? {
            sessionId: active.sessionId,
            continuationToken: active.continuationToken,
          }
        : null,
    );
  });

  // Auto-title threads from their first user message (until renamed).
  $effect(() => {
    const active = threads.active;
    if (active.renamed) return;
    for (const message of agent.data.messages) {
      if (message.role !== "user") continue;
      for (const part of message.parts) {
        if (part.type === "text" && part.text.trim().length > 0) {
          const title = toThreadTitle(part.text);
          if (title !== active.title) threads.update(active.id, { title });
          return;
        }
      }
      return;
    }
  });

  function selectThread(id: string) {
    inboxSelection = null;
    view = "chat";
    threads.select(id);
  }

  function selectInbox(sessionId: string, title: string) {
    view = "chat";
    inboxSelection = { sessionId, title };
  }

  function newThread() {
    inboxSelection = null;
    view = "chat";
    threads.create();
  }

  function togglePin(thread: ThreadMeta) {
    threads.update(thread.id, { pinned: !thread.pinned });
  }

  const headerTitle = $derived(
    view === "settings"
      ? "Settings"
      : (inboxSelection?.title ?? threads.active.title),
  );
</script>

<div class="flex min-h-0 flex-1">
  {#if sidebarOpen}
    <!-- Mobile: sidebar overlays the chat; ≥md it sits inline. -->
    <div class="fixed inset-0 z-20 flex md:static md:z-auto">
      <Sidebar
        sections={(query) => threads.sections(query)}
        activeId={threads.activeId}
        activeInboxSessionId={inboxSelection?.sessionId ?? null}
        onSelect={selectThread}
        onSelectInbox={selectInbox}
        onNew={newThread}
        onRename={(id, title) => threads.update(id, { title, renamed: true })}
        onTogglePin={togglePin}
        onDelete={(id) => threads.remove(id)}
        onClose={() => (sidebarOpen = false)}
      />
      <button
        class="flex-1 cursor-default border-0 bg-black/40 md:hidden"
        aria-label="Close sidebar"
        onclick={() => (sidebarOpen = false)}
      ></button>
    </div>
  {/if}

  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
    <header
      class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b bg-background/70 px-3 backdrop-blur-md md:px-4"
    >
      <div class="flex min-w-0 items-center gap-2">
        {#if !sidebarOpen}
          <button
            class="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 font-mono text-[11px] text-gray-600 hover:bg-gray-200 hover:text-foreground"
            title="Show sidebar"
            aria-label="Show sidebar"
            onclick={() => (sidebarOpen = true)}
          >
            ⟩⟩
          </button>
          <a
            class="flex items-baseline gap-2 text-sm text-foreground no-underline"
            href="#/"
            title={IS_AGENT_APP ? BRAND_NAME : "Back to the homepage"}
          >
            <span aria-hidden="true">▲</span>
            <span class="font-semibold tracking-[-0.28px]">{BRAND_NAME}</span>
          </a>
        {/if}
        <span class="truncate text-[13px] text-muted-foreground">
          {headerTitle}
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100"
          title={modelKey.providerLabel
            ? `Your ${modelKey.providerLabel} key — chats spend your own credits`
            : "Your API key — chats spend your own credits"}
          onclick={() => (keyDialogOpen = true)}
        >
          <span class="text-[10px] font-medium tracking-[0.04em] text-gray-600 uppercase">key</span>
          <span class="font-mono font-medium text-foreground">
            {#if modelKey.hint}
              {modelKey.provider === "openrouter" ? "or" : "gw"} …{modelKey.hint}
            {:else}
              none
            {/if}
          </span>
        </button>
        <button
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100 {view ===
          'settings'
            ? 'bg-gray-200 text-foreground'
            : 'bg-background text-muted-foreground'}"
          title="Workflow runs, queue health, notepad and configuration"
          onclick={() => (view = view === "settings" ? "chat" : "settings")}
        >
          <span aria-hidden="true">⚙</span> Settings
        </button>
      </div>
    </header>

    {#if view === "settings"}
      <SettingsView onOpenKeyDialog={() => (keyDialogOpen = true)} />
    {:else if inboxSelection !== null}
      <InboxTranscript
        sessionId={inboxSelection.sessionId}
        title={inboxSelection.title}
      />
    {:else}
      <Chat {agent} />
    {/if}
  </div>
</div>

{#if keyRequired || keyDialogOpen}
  <ApiKeyDialog required={keyRequired} onClose={() => (keyDialogOpen = false)} />
{/if}
