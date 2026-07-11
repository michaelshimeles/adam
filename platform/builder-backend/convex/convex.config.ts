import { defineApp } from "convex/server";
import selfHosting from "@convex-dev/static-hosting/convex.config.js";

// Static hosting serves the builder UI (platform/builder-web) from this same
// deployment — the builder is its own app at https://<deployment>.convex.site.
const app = defineApp();
app.use(selfHosting);

export default app;
