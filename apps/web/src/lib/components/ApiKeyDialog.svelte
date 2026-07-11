<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { gatewayKey } from "../apiKey.svelte";
  import { keysApi } from "../api";
  import { Button } from "ui/components/button";
  import { Input } from "ui/components/input";
  import { Label } from "ui/components/label";

  // BYOK gate: the deployment is public, so chats run on the visitor's own
  // AI Gateway key. `required` (no key saved yet) blocks the dashboard until
  // a key is provided; opened from the topbar chip it's a normal dialog.
  let { required = false, onClose }: { required?: boolean; onClose: () => void } =
    $props();

  const client = useConvexClient();

  let draft = $state("");
  let checking = $state(false);
  let error = $state<string | null>(null);

  const focusOnMount = (node: HTMLInputElement) => {
    node.focus();
  };

  async function validateAndSave() {
    const apiKey = draft.trim();
    if (!apiKey || checking) return;
    checking = true;
    error = null;
    try {
      const result = await client.action(keysApi.validate, { apiKey });
      if (!result.ok) {
        error = result.error ?? "The AI Gateway rejected this key.";
        return;
      }
      gatewayKey.set(apiKey);
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      checking = false;
    }
  }

  function removeKey() {
    gatewayKey.clear();
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
      Add Your AI Gateway Key
    </h2>
    <p class="m-0 text-[13px] leading-[18px] text-muted-foreground">
      This demo is public, so the agent runs on
      <em class="font-semibold text-foreground not-italic">your</em> Vercel AI Gateway key — every
      message you send spends your credits, nobody else's. Create a free key in the Vercel
      dashboard under
      <a
        class="text-foreground underline decoration-alpha-500 underline-offset-4 hover:decoration-alpha-800"
        href="https://vercel.com/docs/ai-gateway"
        target="_blank"
        rel="noreferrer">AI Gateway → API keys</a
      >.
    </p>

    <form
      class="mt-1 flex flex-col gap-2.5"
      onsubmit={(e) => {
        e.preventDefault();
        void validateAndSave();
      }}
    >
      <Label
        for="gateway-key"
        class="font-mono text-[10px] font-semibold tracking-[0.12em] text-gray-600 uppercase"
      >
        AI Gateway API Key
      </Label>
      <Input
        id="gateway-key"
        type="password"
        class="font-mono max-sm:text-base"
        placeholder="vck_…"
        autocomplete="off"
        spellcheck="false"
        bind:value={draft}
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

    {#if gatewayKey.hint}
      <div class="flex items-center gap-2.5 text-xs text-muted-foreground">
        <span>
          A key ending in
          <code class="font-mono text-foreground">…{gatewayKey.hint}</code> is saved.
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
      server-side while they run. Rotate or revoke it anytime in Vercel.
    </p>
  </div>
</div>
