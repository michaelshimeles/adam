<script lang="ts">
  import { setupConvex } from "convex-svelte";
  import { onDestroy } from "svelte";
  import { CONVEX_URL } from "./lib/api";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import Landing from "./lib/components/Landing.svelte";

  setupConvex(CONVEX_URL);

  // Tiny hash router: "#/dashboard" is the app, everything else the homepage.
  let hash = $state(window.location.hash);
  const onHashChange = () => (hash = window.location.hash);
  window.addEventListener("hashchange", onHashChange);
  onDestroy(() => window.removeEventListener("hashchange", onHashChange));

  const showDashboard = $derived(hash.replace(/^#\/?/, "").startsWith("dashboard"));
</script>

{#if showDashboard}
  <Dashboard />
{:else}
  <Landing />
{/if}
