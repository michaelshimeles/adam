<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { timeAgo } from "../format";
  import { getNow } from "../now.svelte";

  const notes = useQuery(api.notesList, { limit: 50 });
</script>

<section class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
  <header class="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b px-4">
    <h2 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
      Team Notepad
    </h2>
    <span
      class="inline-flex items-center gap-1.5 font-mono text-[11px] text-green-900"
      title="Convex reactive query — updates the instant the agent writes"
    >
      <span class="size-1.5 animate-pulse rounded-full bg-current"></span> live
    </span>
  </header>

  {#if notes.isLoading}
    <div class="px-4 py-5 text-center text-xs text-muted-foreground">Loading…</div>
  {:else if notes.error}
    <div class="px-4 py-5 text-center text-xs text-red-900">
      Can't reach Convex: {notes.error.message}
    </div>
  {:else if notes.data.length === 0}
    <div class="px-4 py-5 text-xs leading-5 text-muted-foreground">
      No notes yet. Ask the agent to
      <em class="text-foreground not-italic">“Save a note: the demo runs entirely on Convex”</em>
      and it appears here instantly.
    </div>
  {:else}
    <ul class="m-0 flex min-h-0 list-none flex-col divide-y overflow-y-auto p-0">
      {#each notes.data as note (note.id)}
        <li class="px-4 py-3">
          <p class="m-0 mb-1.5 text-[13px] leading-[18px] break-words whitespace-pre-wrap">
            {note.text}
          </p>
          <div class="flex justify-between gap-2 font-mono text-[11px] text-gray-600">
            <span class="max-w-[60%] truncate">{note.author}</span>
            <span>{timeAgo(note.createdAt, getNow())}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
