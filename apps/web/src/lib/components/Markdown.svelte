<script lang="ts">
  import DOMPurify from "dompurify";
  import { marked } from "marked";

  let { text }: { text: string } = $props();

  const html = $derived(
    DOMPurify.sanitize(marked.parse(text, { async: false, gfm: true })),
  );
</script>

<div class="markdown min-w-0 text-sm leading-6 break-words text-foreground">
  <!-- eslint-disable-next-line svelte/no-at-html-tags — sanitized above -->
  {@html html}
</div>

<style>
  .markdown :global(p) {
    margin: 0 0 0.6em;
  }
  .markdown :global(p:last-child) {
    margin-bottom: 0;
  }
  .markdown :global(h1),
  .markdown :global(h2),
  .markdown :global(h3),
  .markdown :global(h4) {
    margin: 0.9em 0 0.4em;
    font-weight: 600;
    line-height: 1.3;
  }
  .markdown :global(h1) {
    font-size: 1.15rem;
  }
  .markdown :global(h2) {
    font-size: 1.05rem;
  }
  .markdown :global(h3),
  .markdown :global(h4) {
    font-size: 0.95rem;
  }
  .markdown :global(ul),
  .markdown :global(ol) {
    margin: 0 0 0.6em;
    padding-left: 1.4em;
  }
  .markdown :global(li) {
    margin: 0.15em 0;
  }
  .markdown :global(code) {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.85em;
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.1em 0.35em;
  }
  .markdown :global(pre) {
    margin: 0 0 0.6em;
    padding: 0.65rem 0.8rem;
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow-x: auto;
  }
  .markdown :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.8rem;
  }
  .markdown :global(blockquote) {
    margin: 0 0 0.6em;
    padding-left: 0.8em;
    border-left: 2px solid var(--border);
    color: var(--muted-foreground);
  }
  .markdown :global(a) {
    color: var(--ring);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .markdown :global(table) {
    border-collapse: collapse;
    margin: 0 0 0.6em;
    font-size: 0.85rem;
  }
  .markdown :global(th),
  .markdown :global(td) {
    border: 1px solid var(--border);
    padding: 0.3em 0.6em;
    text-align: left;
  }
  .markdown :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0.8em 0;
  }
</style>
