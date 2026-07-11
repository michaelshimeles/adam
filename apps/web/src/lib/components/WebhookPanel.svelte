<script lang="ts">
  import { BRAND_NAME } from "../brand";

  /**
   * Shown only on builder-deployed agent apps with the webhook channel on
   * (VITE_WEBHOOK_ENABLED=1). The secret is deliberately NOT baked into this
   * public bundle — it lives in the agent builder's detail view.
   */
  const url = `${window.location.origin}/channels/webhook`;

  const example = [
    `curl -X POST ${url} \\`,
    `  -H 'content-type: application/json' \\`,
    `  -H 'x-webhook-secret: <secret from your builder>' \\`,
    `  -d '{"message": "Hello ${BRAND_NAME}", "replyUrl": "https://…"}'`,
  ].join("\n");

  let copied = $state(false);
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // clipboard unavailable (permissions/http) — leave the text selectable
    }
  }
</script>

<section class="flex shrink-0 flex-col overflow-hidden rounded-lg border bg-background">
  <header class="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b px-4">
    <h2 class="m-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
      Webhook Channel
    </h2>
    <span class="inline-flex items-center gap-1.5 font-mono text-[11px] text-green-900">
      <span class="size-1.5 rounded-full bg-current"></span> enabled
    </span>
  </header>
  <div class="flex flex-col px-4 py-3">
    <p class="m-0 mb-2.5 text-xs leading-4 text-muted-foreground">
      Any external system can message this agent over HTTP. Reuse the returned
      <code class="font-mono text-[11px] text-foreground">conversationId</code> to continue a
      session; pass a
      <code class="font-mono text-[11px] text-foreground">replyUrl</code> to receive the agent's
      replies.
    </p>
    <button
      class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-gray-100 px-2.5 py-2 text-left font-mono text-xs transition-colors duration-150 hover:border-alpha-500"
      title="Copy the webhook URL"
      onclick={copyUrl}
    >
      <span class="shrink-0 font-medium text-blue-900">POST</span>
      <span class="truncate text-muted-foreground">{url}</span>
      <span class="ml-auto shrink-0 text-[10px] tracking-[0.06em] text-gray-600 uppercase">
        {copied ? "copied" : "copy"}
      </span>
    </button>
    <pre
      class="mt-2.5 mb-0 overflow-x-auto rounded-md border bg-gray-100/50 px-3 py-2.5 font-mono text-[11px] leading-relaxed whitespace-pre text-muted-foreground">{example}</pre>
  </div>
</section>
