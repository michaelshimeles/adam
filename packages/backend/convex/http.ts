import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

const http = httpRouter();

// Serve the built Svelte app (apps/web) from Convex file storage.
// Upload with `pnpm deploy:web` (build + upload) from the repo root.
registerStaticRoutes(http, components.selfHosting, { spaFallback: true });

export default http;
