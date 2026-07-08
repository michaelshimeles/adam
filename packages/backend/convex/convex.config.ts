import { defineApp } from "convex/server";
import selfHosting from "@convex-dev/static-hosting/convex.config.js";

const app = defineApp();
app.use(selfHosting);

export default app;
