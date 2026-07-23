<script lang="ts">
  import { setupConvex } from "convex-svelte";
  import { BUILDER_CONVEX_URL } from "./lib/api";
  import BuilderApp from "./lib/components/BuilderApp.svelte";
  import Landing from "./lib/components/Landing.svelte";

  setupConvex(BUILDER_CONVEX_URL);

  function normalizePath(pathname: string): string {
    const trimmed = pathname.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  }

  let path = $state(normalizePath(window.location.pathname));

  $effect(() => {
    const onPopState = () => {
      path = normalizePath(window.location.pathname);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  });

  const isBuilder = $derived(path === "/builder");

  $effect(() => {
    document.title = isBuilder
      ? "adam agent builder — one-click durable agents on Convex"
      : "adam — the durable agent runtime, all on Convex";
  });
</script>

{#if isBuilder}
  <BuilderApp />
{:else}
  <Landing />
{/if}
