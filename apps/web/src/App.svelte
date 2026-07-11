<script lang="ts">
  import { setupConvex } from "convex-svelte";
  import { onDestroy } from "svelte";
  import { CONVEX_URL } from "./lib/api";
  import { BRAND_NAME, IS_AGENT_APP } from "./lib/brand";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import Landing from "./lib/components/Landing.svelte";

  setupConvex(CONVEX_URL);

  // Builder-deployed agent apps get their own title; adam keeps index.html's.
  if (IS_AGENT_APP) {
    document.title = `${BRAND_NAME} — agent on Convex`;
  }

  // Tiny hash router: "#/dashboard" is the app, everything else the homepage.
  // Deployed agent apps have no homepage — the dashboard IS the app.
  let hash = $state(window.location.hash);
  const onHashChange = () => (hash = window.location.hash);
  window.addEventListener("hashchange", onHashChange);
  onDestroy(() => window.removeEventListener("hashchange", onHashChange));

  const showDashboard = $derived(
    IS_AGENT_APP || hash.replace(/^#\/?/, "").startsWith("dashboard"),
  );
</script>

{#if showDashboard}
  <Dashboard />
{:else}
  <Landing />
{/if}
