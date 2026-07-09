<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { gatewayKey } from "../apiKey.svelte";
  import { keysApi } from "../api";

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

  function saveUnchecked() {
    const apiKey = draft.trim();
    if (!apiKey) return;
    gatewayKey.set(apiKey);
    onClose();
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

<div class="overlay">
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="key-dialog-title"
  >
    <p class="kicker">bring your own key</p>
    <h2 id="key-dialog-title">Add your AI Gateway key</h2>
    <p class="body">
      This demo is public, so the agent runs on <em>your</em> Vercel AI
      Gateway key — every message you send spends your credits, nobody
      else's. Create a free key in the Vercel dashboard under
      <a
        href="https://vercel.com/docs/ai-gateway"
        target="_blank"
        rel="noreferrer">AI Gateway → API keys</a
      >.
    </p>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        void validateAndSave();
      }}
    >
      <label class="field-label" for="gateway-key">AI gateway api key</label>
      <input
        id="gateway-key"
        type="password"
        placeholder="vck_…"
        autocomplete="off"
        spellcheck="false"
        bind:value={draft}
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
        <button
          type="button"
          class="btn ghost"
          disabled={checking || draft.trim().length === 0}
          onclick={saveUnchecked}
        >
          Use without validating
        </button>
        {#if !required}
          <button type="button" class="btn ghost" onclick={onClose}>
            Cancel
          </button>
        {/if}
      </div>
    </form>

    {#if gatewayKey.hint}
      <div class="saved">
        <span>A key ending in <code>…{gatewayKey.hint}</code> is saved.</span>
        <button type="button" class="link" onclick={removeKey}>
          Remove it
        </button>
      </div>
    {/if}

    <p class="fine-print">
      The key stays in this browser and is attached to your chat sessions
      server-side while they run. Rotate or revoke it anytime in Vercel.
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
</style>
