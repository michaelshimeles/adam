<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { manageApi } from "../api";
  import { BRAND_NAME } from "../brand";
  import { timeAgo } from "../format";

  /**
   * What the agent does and knows on its own: reminders, event triggers,
   * memories, and saved skills. Read-only by design — every write on these
   * tables requires the agent's service secret, so creating, changing, or
   * deleting happens by asking in chat.
   */

  type Tab = "reminders" | "triggers" | "memory" | "skills";
  let tab = $state<Tab>("reminders");

  const reminders = useQuery(manageApi.reminders, () => ({}));
  const triggers = useQuery(manageApi.triggers, () => ({}));
  const memories = useQuery(manageApi.memories, () => ({}));
  const skills = useQuery(manageApi.skills, () => ({}));

  const tabs = $derived<{ id: Tab; label: string; count: number | null }[]>([
    { id: "reminders", label: "Reminders", count: reminders.data?.length ?? null },
    { id: "triggers", label: "Triggers", count: triggers.data?.length ?? null },
    { id: "memory", label: "Memory", count: memories.data?.length ?? null },
    { id: "skills", label: "Skills", count: skills.data?.length ?? null },
  ]);

  function fireTime(ms: number): string {
    return new Date(ms).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
</script>

{#snippet empty(hint: string)}
  <p class="m-0 px-1 py-8 text-center text-sm text-muted-foreground">{hint}</p>
{/snippet}

{#snippet loading()}
  <p class="m-0 px-1 py-8 text-center font-mono text-xs text-muted-foreground">loading…</p>
{/snippet}

<div class="min-h-0 flex-1 overflow-y-auto">
  <div class="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
    <header class="mb-5">
      <h1 class="m-0 text-lg font-semibold">Manage</h1>
      <p class="m-0 mt-1 text-sm text-muted-foreground">
        What {BRAND_NAME} does and knows on its own. Create, change, or delete any of
        these by asking in chat.
      </p>
    </header>

    <div role="tablist" aria-label="Manage sections" class="mb-4 flex flex-wrap gap-1.5">
      {#each tabs as entry (entry.id)}
        <button
          type="button"
          role="tab"
          aria-selected={tab === entry.id}
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors duration-150 hover:border-alpha-500 hover:bg-gray-100 {tab === entry.id
            ? 'bg-gray-200 text-foreground'
            : 'bg-background text-muted-foreground'}"
          onclick={() => (tab = entry.id)}
        >
          {entry.label}
          {#if entry.count !== null}
            <span class="font-mono text-[10px] text-gray-600">{entry.count}</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if tab === "reminders"}
      {#if reminders.isLoading}
        {@render loading()}
      {:else if (reminders.data ?? []).length === 0}
        {@render empty(`No reminders. Ask in chat: “remind me to stretch every day at 9am”.`)}
      {:else}
        <ul class="m-0 flex list-none flex-col p-0">
          {#each reminders.data ?? [] as reminder (reminder.id)}
            <li class="flex flex-col gap-1 border-b py-3 last:border-b-0">
              <div class="flex items-baseline justify-between gap-3">
                <span class="min-w-0 text-sm leading-5 text-foreground">{reminder.prompt}</span>
                <span
                  class="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] text-gray-600"
                >
                  {reminder.cron ? "recurring" : "one-off"}
                </span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-gray-600">
                <span>next {fireTime(reminder.nextFireAt)}</span>
                {#if reminder.cron}<span>cron {reminder.cron}</span>{/if}
                <span>{reminder.timezone}</span>
                {#if reminder.lastFiredAt !== null}
                  <span>last fired {timeAgo(reminder.lastFiredAt)}</span>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    {:else if tab === "triggers"}
      {#if triggers.isLoading}
        {@render loading()}
      {:else if (triggers.data ?? []).length === 0}
        {@render empty(`No event triggers. Ask in chat: “create a webhook that alerts me when a deploy fails”.`)}
      {:else}
        <ul class="m-0 flex list-none flex-col p-0">
          {#each triggers.data ?? [] as trigger (trigger.hookId)}
            <li class="flex flex-col gap-1 border-b py-3 last:border-b-0">
              <div class="flex items-baseline justify-between gap-3">
                <span class="min-w-0 text-sm font-medium text-foreground">{trigger.name}</span>
                <span class="shrink-0 font-mono text-[11px] text-gray-600">
                  fired {trigger.fireCount}×
                </span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-gray-600">
                <span>created {timeAgo(trigger.createdAt)}</span>
                {#if trigger.lastFiredAt !== null}
                  <span>last fired {timeAgo(trigger.lastFiredAt)}</span>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
        <p class="m-0 mt-3 text-xs text-muted-foreground">
          Trigger URLs embed their secret, so they aren't shown here — ask in chat if
          you need one again.
        </p>
      {/if}
    {:else if tab === "memory"}
      {#if memories.isLoading}
        {@render loading()}
      {:else if (memories.data ?? []).length === 0}
        {@render empty(`Nothing remembered yet. Share a durable fact in chat and ${BRAND_NAME} saves it on its own.`)}
      {:else}
        <ul class="m-0 flex list-none flex-col p-0">
          {#each memories.data ?? [] as memory (memory.id)}
            <li class="flex flex-col gap-1 border-b py-3 last:border-b-0">
              <div class="flex items-baseline justify-between gap-3">
                <span class="min-w-0 text-sm leading-5 text-foreground">{memory.content}</span>
                {#if memory.permanent}
                  <span
                    class="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] text-gray-600"
                  >
                    permanent
                  </span>
                {/if}
              </div>
              <span class="font-mono text-[11px] text-gray-600">
                updated {timeAgo(memory.updatedAt)}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    {:else if tab === "skills"}
      {#if skills.isLoading}
        {@render loading()}
      {:else if (skills.data ?? []).length === 0}
        {@render empty(`No saved skills. Describe a repeatable workflow in chat and ask ${BRAND_NAME} to save it as a skill.`)}
      {:else}
        <ul class="m-0 flex list-none flex-col p-0">
          {#each skills.data ?? [] as skill (skill.name)}
            <li class="border-b py-3 last:border-b-0">
              <details>
                <summary
                  class="flex cursor-pointer list-none items-baseline justify-between gap-3 [&::-webkit-details-marker]:hidden"
                >
                  <span class="flex min-w-0 items-baseline gap-2">
                    <span class="font-mono text-sm text-foreground">/{skill.name}</span>
                    <span class="truncate text-xs text-muted-foreground">
                      {skill.description}
                    </span>
                  </span>
                  <span class="shrink-0 font-mono text-[11px] text-gray-600">
                    updated {timeAgo(skill.updatedAt)}
                  </span>
                </summary>
                <pre
                  class="mt-2 max-h-72 overflow-auto rounded-md border bg-gray-100/60 p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-muted-foreground">{skill.markdown}</pre>
              </details>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>
