<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";
  import { timeAgo } from "../format";
  import { getNow } from "../now.svelte";

  const notes = useQuery(api.notesList, { limit: 50 });
</script>

<section class="panel">
  <header>
    <h2>Team notepad</h2>
    <span class="live" title="Convex reactive query — updates the instant the agent writes">
      <span class="live-dot"></span> live
    </span>
  </header>
  <p class="hint">
    Durable agent memory in Convex. Ask the agent to “save a note” and watch it
    appear here instantly.
  </p>

  {#if notes.isLoading}
    <div class="empty">Loading…</div>
  {:else if notes.error}
    <div class="empty error">Can't reach Convex: {notes.error.message}</div>
  {:else if notes.data.length === 0}
    <div class="empty">
      No notes yet — try
      <em>“Save a note: the demo runs entirely on Convex”</em>
    </div>
  {:else}
    <ul>
      {#each notes.data as note (note.id)}
        <li>
          <p class="text">{note.text}</p>
          <div class="meta">
            <span class="author">{note.author}</span>
            <span class="when">{timeAgo(note.createdAt, getNow())}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .panel {
    background: var(--panel);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius);
    padding: 18px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ededf0;
  }

  .live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--green);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 2s ease-in-out infinite;
  }

  .hint {
    margin: 6px 0 12px;
    color: var(--text-faint);
    font-size: 12px;
    line-height: 1.45;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  li {
    background: var(--panel-2);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
  }

  .text {
    margin: 0 0 6px;
    font-size: 13px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 11px;
    color: var(--text-faint);
  }

  .author {
    font-family: var(--mono);
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    color: var(--text-faint);
    font-size: 12.5px;
    padding: 18px 6px;
    text-align: center;
    line-height: 1.5;
  }

  .empty em {
    color: var(--text-dim);
  }

  .empty.error {
    color: var(--red);
  }
</style>
