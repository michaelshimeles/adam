import { inject } from "@vercel/analytics";
import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

// Vercel Web Analytics (plain-Vite variant of injectAnalytics). Pageviews
// post to /_vercel/insights/* — live when the site is served via Vercel;
// harmless no-op elsewhere (e.g. Convex static hosting).
inject({ mode: import.meta.env.DEV ? "development" : "production" });

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
