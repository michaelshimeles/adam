<script lang="ts">
  import type { ModelOption } from "../api";
  import { webModel } from "../models.svelte";

  let { models }: { models: ModelOption[] } = $props();

  let open = $state(false);
  let query = $state("");
  // null shows every provider; "favorites" narrows to starred models.
  let providerFilter = $state<string | null>(null);
  let container: HTMLDivElement | undefined = $state();
  // Providers whose models.dev logo failed to load fall back to initials.
  let failedLogos = $state<Record<string, boolean>>({});

  function modelProvider(id: string): string {
    return id.split("/")[0] ?? id;
  }

  /** Rough cost tier from the per-token input price: $ under $1/M, $$ under $5/M, $$$ above. */
  function priceTier(pricing: ModelOption["pricing"]): string {
    const perToken = Number(pricing?.input);
    if (!Number.isFinite(perToken) || perToken <= 0) return "";
    const perMillion = perToken * 1_000_000;
    return perMillion < 1 ? "$" : perMillion < 5 ? "$$" : "$$$";
  }

  function logoUrl(provider: string): string {
    return `https://models.dev/logos/${encodeURIComponent(provider)}.svg`;
  }

  const providers = $derived(
    [...new Set(models.map((option) => modelProvider(option.id)))].sort(),
  );

  const filtered = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    return models.filter((option) => {
      if (providerFilter === "favorites" && !webModel.favorites.includes(option.id)) {
        return false;
      }
      if (
        providerFilter !== null &&
        providerFilter !== "favorites" &&
        modelProvider(option.id) !== providerFilter
      ) {
        return false;
      }
      return (
        needle.length === 0 ||
        option.id.toLowerCase().includes(needle) ||
        option.name.toLowerCase().includes(needle)
      );
    });
  });

  const label = $derived(
    models.find((option) => option.id === webModel.selected)?.name ??
      webModel.selected.split("/").pop() ??
      webModel.selected,
  );

  // Close when clicking anywhere outside the picker.
  $effect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!container?.contains(event.target as Node)) open = false;
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  });

  function toggleOpen() {
    open = !open;
    query = "";
  }
</script>

<div bind:this={container} class="relative">
  <button
    type="button"
    aria-label="Select model"
    aria-expanded={open}
    class="flex max-w-44 cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent pl-1 font-mono text-[11px] text-gray-600 transition-colors hover:text-foreground"
    onclick={toggleOpen}
  >
    <span class="truncate">{label}</span>
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" aria-hidden="true" class="shrink-0">
      <path d="M4.2 6.2a.7.7 0 0 1 1-.05L8 8.6l2.8-2.45a.7.7 0 1 1 .92 1.06l-3.26 2.85a.7.7 0 0 1-.92 0L4.28 7.2a.7.7 0 0 1-.07-1Z" />
    </svg>
  </button>

  {#if open}
    <div
      class="absolute bottom-full left-0 z-30 mb-2 flex w-[24rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-lg"
    >
      <div class="flex items-center gap-2 border-b px-3 py-2">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="shrink-0 text-gray-600">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" stroke-linecap="round" />
        </svg>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          autofocus
          bind:value={query}
          placeholder="Search models…"
          aria-label="Search models"
          class="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          onkeydown={(event) => {
            if (event.key === "Escape") open = false;
          }}
        />
      </div>
      <div class="flex min-h-0">
        <div
          role="tablist"
          aria-label="Filter by provider"
          class="flex max-h-72 w-11 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            role="tab"
            aria-selected={providerFilter === "favorites"}
            aria-label="Favorites"
            title="Favorites"
            class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-gray-600 transition-colors hover:bg-gray-100 hover:text-foreground {providerFilter === 'favorites' ? 'bg-gray-100 text-foreground' : ''}"
            onclick={() =>
              (providerFilter = providerFilter === "favorites" ? null : "favorites")}
          >
            ★
          </button>
          {#each providers as provider (provider)}
            <button
              type="button"
              role="tab"
              aria-selected={providerFilter === provider}
              aria-label={provider}
              title={provider}
              class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[10px] font-semibold uppercase text-gray-600 transition-colors hover:bg-gray-100 hover:text-foreground {providerFilter === provider ? 'bg-gray-100 text-foreground' : ''}"
              onclick={() =>
                (providerFilter = providerFilter === provider ? null : provider)}
            >
              {#if failedLogos[provider]}
                {provider.slice(0, 2)}
              {:else}
                <!-- models.dev logos use fill="currentColor"; a mask keeps the
                     button's text color. A hidden img probes availability. -->
                <img
                  src={logoUrl(provider)}
                  alt=""
                  hidden
                  onerror={() => (failedLogos = { ...failedLogos, [provider]: true })}
                />
                <span
                  aria-hidden="true"
                  class="size-3.5 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                  style="mask-image: url({logoUrl(provider)})"
                ></span>
              {/if}
            </button>
          {/each}
        </div>
        <div
          role="listbox"
          aria-label="Models"
          class="max-h-72 min-w-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {#if filtered.length === 0}
            <p class="m-0 px-2 py-2 text-xs text-muted-foreground">
              {models.length === 0
                ? "Model list unavailable — add your API key first."
                : providerFilter === "favorites" && webModel.favorites.length === 0
                  ? "No favorites yet. Star a model to pin it here."
                  : "No models match."}
            </p>
          {/if}
          {#each filtered as option (option.id)}
            {@const tier = priceTier(option.pricing)}
            {@const starred = webModel.favorites.includes(option.id)}
            <div class="group/model relative rounded-lg transition-colors hover:bg-gray-100">
              <button
                type="button"
                role="option"
                aria-selected={option.id === webModel.selected}
                class="w-full cursor-pointer border-0 bg-transparent px-2 py-1.5 pr-9 text-left"
                onclick={() => {
                  webModel.select(option.id);
                  open = false;
                }}
              >
                <span class="flex items-center gap-1.5">
                  <span class="truncate text-sm font-medium text-foreground">{option.name}</span>
                  {#if tier}
                    <span class="shrink-0 text-[11px] text-gray-600">{tier}</span>
                  {/if}
                  {#if option.id === webModel.selected}
                    <span class="shrink-0 text-[11px] text-foreground" aria-hidden="true">✓</span>
                  {/if}
                </span>
                <span class="block truncate text-xs text-muted-foreground">
                  {option.description || option.id}
                </span>
              </button>
              <button
                type="button"
                aria-label={starred ? `Unfavorite ${option.name}` : `Favorite ${option.name}`}
                aria-pressed={starred}
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-0 bg-transparent p-1 text-sm transition-colors {starred ? 'text-amber-500' : 'text-gray-400 opacity-0 hover:text-foreground group-hover/model:opacity-100'}"
                onclick={() => webModel.toggleFavorite(option.id)}
              >
                {starred ? "★" : "☆"}
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
