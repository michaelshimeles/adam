import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

const http = httpRouter();

// Serve the uploaded builder UI; spaFallback routes unknown paths to
// index.html so the hash-less SPA works on hard reloads.
registerStaticRoutes(http, components.selfHosting, { spaFallback: true });

export default http;
