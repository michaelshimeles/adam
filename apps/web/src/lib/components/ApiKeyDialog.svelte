<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { modelKey, type ModelProvider } from "../apiKey.svelte";
  import { keysApi } from "../api";

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

<div class="overlay">
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="key-dialog-title"
  >
    <p class="kicker">bring your own key</p>
    <h2 id="key-dialog-title">Add your API key</h2>
    <p class="body">
      This demo is public, so the agent runs on <em>your</em> key — every
      message you send spends your credits, nobody else's.
      {#if provider === "gateway"}
        Create a free key in the Vercel dashboard under
        <a
          href="https://vercel.com/docs/ai-gateway"
          target="_blank"
          rel="noreferrer">AI Gateway → API keys</a
        >.
      {:else}
        Create a key on
        <a
          href="https://openrouter.ai/settings/keys"
          target="_blank"
          rel="noreferrer">OpenRouter → API keys</a
        >.
      {/if}
    </p>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        void validateAndSave();
      }}
    >
      <div
        class="provider-toggle"
        role="radiogroup"
        aria-label="Key provider"
      >
        {#each Object.entries(PROVIDERS) as [id, meta] (id)}
          <button
            type="button"
            class="provider-option"
            class:active={provider === id}
            role="radio"
            aria-checked={provider === id}
            onclick={() => selectProvider(id as ModelProvider)}
          >
            {meta.label}
          </button>
        {/each}
      </div>

      <label class="field-label" for="model-key">
        {PROVIDERS[provider].label} api key
      </label>
      <input
        id="model-key"
        type="password"
        placeholder={PROVIDERS[provider].placeholder}
        autocomplete="off"
        spellcheck="false"
        bind:value={draft}
        oninput={onInput}
        {@attach focusOnMount}
      />

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="actions">
        <button
          type="submit"
          class="btn primary"
          disabled={checking || draft.trim().length === 0}
        >
          {checking ? "Checking…" : "Validate & enter"}
        </button>
        {#if !required}
          <button type="button" class="btn ghost" onclick={onClose}>
            Cancel
          </button>
        {/if}
      </div>
    </form>

    {#if modelKey.hint}
      <div class="saved">
        <span>
          A {modelKey.providerLabel} key ending in
          <code>…{modelKey.hint}</code> is saved.
        </span>
        <button type="button" class="link" onclick={removeKey}>
          Remove it
        </button>
      </div>
    {/if}

    <p class="fine-print">
      The key stays in this browser and is attached to your chat sessions
      server-side while they run. Rotate or revoke it anytime with your
      provider.
    </p>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(5, 5, 6, 0.7);
    backdrop-filter: blur(8px);
  }

  .dialog {
    width: min(480px, 100%);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  }

  .kicker {
    margin: 0;
    font-family: var(--mono);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: #fff;
  }

  .body {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-dim);
  }

  .body em {
    color: var(--text);
    font-style: normal;
    font-weight: 600;
  }

  .body a {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(255, 255, 255, 0.3);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .provider-toggle {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
  }

  .provider-option {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .provider-option:hover {
    color: var(--text);
  }

  .provider-option.active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  .field-label {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  input {
    width: 100%;
    box-sizing: border-box;
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 10px 13px;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: #101014;
  }

  .error {
    margin: 0;
    font-size: 12.5px;
    color: var(--red);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
  }

  .btn {
    border-radius: 999px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn.primary {
    background: #fff;
    color: #0a0a0c;
    transition:
      transform 0.12s,
      box-shadow 0.12s;
  }

  .btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.18);
  }

  .btn.ghost {
    background: transparent;
    color: #c8c8ce;
    border-color: rgba(255, 255, 255, 0.16);
    transition:
      border-color 0.15s,
      color 0.15s;
  }

  .btn.ghost:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .saved {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--text-dim);
  }

  .saved code {
    font-family: var(--mono);
    color: var(--text);
  }

  .link {
    background: none;
    border: none;
    padding: 0;
    font-size: 12px;
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
  }

  .fine-print {
    margin: 2px 0 0;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--text-faint);
  }

  @media (max-width: 640px) {
    .overlay {
      padding: 14px;
      align-items: flex-end;
    }

    .dialog {
      padding: 22px 18px;
      max-height: 85dvh;
      overflow-y: auto;
      margin-bottom: 10px;
    }

    input {
      /* 16px stops iOS Safari from zooming the page on focus. */
      font-size: 16px;
    }

    .actions .btn {
      flex: 1;
      padding: 11px 18px;
    }
  }
</style>
