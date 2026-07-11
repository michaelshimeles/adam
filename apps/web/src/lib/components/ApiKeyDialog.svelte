<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { modelKey, type ModelProvider } from "../apiKey.svelte";
  import { keysApi } from "../api";
  import { Button } from "ui/components/button";
  import { Input } from "ui/components/input";
  import { Label } from "ui/components/label";

  // BYOK gate: the deployment is public, so chats run on the visitor's own
  // key — a Vercel AI Gateway key or an OpenRouter key. `required` (no key
  // saved yet) blocks the dashboard until a key is provided; opened from
  // the topbar chip it's a normal dialog.
  let { required = false, onClose }: { required?: boolean; onClose: () => void } =
    $props();

  const client = useConvexClient();

  const PROVIDERS: Record<
    ModelProvider,
    {
      label: string;
      rejected: string;
      placeholder: string;
      keyPrefix: string;
    }
  > = {
    gateway: {
      label: "Vercel AI Gateway",
      rejected: "The AI Gateway rejected this key.",
      placeholder: "vck_…",
      keyPrefix: "vck_",
    },
    openrouter: {
      label: "OpenRouter",
      rejected: "OpenRouter rejected this key.",
      placeholder: "sk-or-v1-…",
      keyPrefix: "sk-or-",
    },
  };

  let provider = $state<ModelProvider>(modelKey.provider ?? "gateway");
  let draft = $state("");
  let checking = $state(false);
  let error = $state<string | null>(null);

  const focusOnMount = (node: HTMLInputElement) => {
    node.focus();
  };

  function selectProvider(next: ModelProvider) {
    if (provider === next) return;
    provider = next;
    error = null;
  }

  // Keys are self-describing (vck_… vs sk-or-…): follow a pasted key to its
  // provider so the toggle never silently disagrees with the input.
  function onInput() {
    const value = draft.trim();
    for (const [id, meta] of Object.entries(PROVIDERS)) {
      if (value.startsWith(meta.keyPrefix)) {
        provider = id as ModelProvider;
        return;
      }
    }
  }

  async function validateAndSave() {
    const apiKey = draft.trim();
    if (!apiKey || checking) return;
    checking = true;
    error = null;
    try {
      const result = await client.action(keysApi.validate, {
        apiKey,
        provider,
      });
      if (!result.ok) {
        error = result.error ?? PROVIDERS[provider].rejected;
        return;
      }
      modelKey.set(provider, apiKey);
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      checking = false;
    }
  }

  function removeKey() {
    modelKey.clear();
    draft = "";
    error = null;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !required) onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-5 backdrop-blur-md max-sm:items-end max-sm:p-3.5"
>
  <div
    class="shadow-modal flex w-[min(480px,100%)] flex-col gap-3 rounded-xl border bg-popover p-7 max-sm:mb-2.5 max-sm:max-h-[85dvh] max-sm:overflow-y-auto max-sm:p-5"
    role="dialog"
    aria-modal="true"
    aria-labelledby="key-dialog-title"
  >
    <p
      class="m-0 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-gray-600 uppercase"
    >
      bring your own key
    </p>
    <h2
      id="key-dialog-title"
      class="m-0 text-xl leading-[26px] font-semibold tracking-[-0.4px] text-gray-1000"
    >
      Add Your API Key
    </h2>
    <p class="m-0 text-[13px] leading-[18px] text-muted-foreground">
      This demo is public, so the agent runs on
      <em class="font-semibold text-foreground not-italic">your</em> key — every
      message you send spends your credits, nobody else's.
      {#if provider === "gateway"}
        Create a free key in the Vercel dashboard under
        <a
          class="text-foreground underline decoration-alpha-500 underline-offset-4 hover:decoration-alpha-800"
          href="https://vercel.com/docs/ai-gateway"
          target="_blank"
          rel="noreferrer">AI Gateway → API keys</a
        >.
      {:else}
        Create a key on
        <a
          class="text-foreground underline decoration-alpha-500 underline-offset-4 hover:decoration-alpha-800"
          href="https://openrouter.ai/settings/keys"
          target="_blank"
          rel="noreferrer">OpenRouter → API keys</a
        >.
      {/if}
    </p>

    <form
      class="mt-1 flex flex-col gap-2.5"
      onsubmit={(e) => {
        e.preventDefault();
        void validateAndSave();
      }}
    >
      <div
        class="flex gap-1 rounded-lg border bg-background p-1"
        role="radiogroup"
        aria-label="Key provider"
      >
        {#each Object.entries(PROVIDERS) as [id, meta] (id)}
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] transition-colors duration-150 {provider ===
            id
              ? 'border-alpha-500 bg-gray-100 text-foreground'
              : 'border-transparent text-gray-600 hover:text-foreground'}"
            role="radio"
            aria-checked={provider === id}
            onclick={() => selectProvider(id as ModelProvider)}
          >
            {meta.label}
          </button>
        {/each}
      </div>

      <Label
        for="model-key"
        class="font-mono text-[10px] font-semibold tracking-[0.12em] text-gray-600 uppercase"
      >
        {PROVIDERS[provider].label} API Key
      </Label>
      <Input
        id="model-key"
        type="password"
        class="font-mono max-sm:text-base"
        placeholder={PROVIDERS[provider].placeholder}
        autocomplete="off"
        spellcheck="false"
        bind:value={draft}
        oninput={onInput}
        {@attach focusOnMount}
      />

      {#if error}
        <p class="m-0 text-xs text-red-900">{error}</p>
      {/if}

      <div class="mt-0.5 flex flex-wrap gap-2">
        <Button
          type="submit"
          class="max-sm:flex-1"
          disabled={checking || draft.trim().length === 0}
        >
          {checking ? "Checking…" : "Validate & Enter"}
        </Button>
        {#if !required}
          <Button type="button" variant="outline" class="max-sm:flex-1" onclick={onClose}>
            Cancel
          </Button>
        {/if}
      </div>
    </form>

    {#if modelKey.hint}
      <div class="flex items-center gap-2.5 text-xs text-muted-foreground">
        <span>
          A {modelKey.providerLabel} key ending in
          <code class="font-mono text-foreground">…{modelKey.hint}</code> is saved.
        </span>
        <button
          type="button"
          class="cursor-pointer border-none bg-transparent p-0 text-xs text-foreground underline decoration-alpha-500 underline-offset-4 hover:decoration-alpha-800"
          onclick={removeKey}
        >
          Remove It
        </button>
      </div>
    {/if}

    <p class="m-0 mt-0.5 text-[11.5px] leading-4 text-gray-600">
      The key stays in this browser and is attached to your chat sessions
      server-side while they run. Rotate or revoke it anytime with your
      provider.
    </p>
  </div>
</div>
