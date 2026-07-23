<script lang="ts">
  import { setupConvex } from "convex-svelte";
  import { CONVEX_URL } from "./lib/api";
  import { BRAND_NAME, IS_AGENT_APP } from "./lib/brand";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import Landing from "./lib/components/Landing.svelte";

  setupConvex(CONVEX_URL);

  // Builder-deployed agent apps get their own title; adam keeps index.html's.
  if (IS_AGENT_APP) {
    document.title = `${BRAND_NAME} — agent on Convex`;
  }

  // Deployed agent apps are the dashboard; the adam build is landing-only
  // (agents are created and managed in the builder instead).
</script>

{#if IS_AGENT_APP}
  <Dashboard />
{:else}
  <Landing />
{/if}
