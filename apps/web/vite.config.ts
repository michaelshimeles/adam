import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    // Same-origin /eve/v1/* → local eve dev server (avoids CORS). When
    // VITE_EVE_HOST is set, the client bypasses this proxy entirely.
    proxy: {
      "/eve": {
        target: process.env.EVE_PROXY_TARGET ?? "http://127.0.0.1:2000",
        changeOrigin: true,
      },
    },
  },
});
