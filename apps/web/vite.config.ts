import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// No proxy needed: chat goes through Convex actions/queries directly
// (see src/lib/chat.svelte.ts) — there is no eve HTTP server in the loop.
export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  server: {
    port: 5173,
  },
});
