// Vendors the compiled eve server bundle (apps/agent/.output/server) into
// packages/backend/eve-runtime/bundle so Convex "use node" actions can import
// the agent + workflow runtime and execute it inside Convex.
//
// Run `eve build` in apps/agent first, then `pnpm vendor:eve` here (the root
// `pnpm build` pipeline chains both).
//
// index.mjs is intentionally excluded: importing it would start the Nitro
// HTTP server. Everything the runner needs is re-exported from _libs/eve.mjs.

import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, "..");
const serverDir = resolve(backendRoot, "../../apps/agent/.output/server");
const outDir = join(backendRoot, "eve-runtime", "bundle");

if (!existsSync(join(serverDir, "_libs", "eve.mjs"))) {
  console.error(
    `Missing ${join(serverDir, "_libs/eve.mjs")}. Run \`eve build\` in apps/agent first.`,
  );
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const entry of ["_libs", "_virtual", "_runtime.mjs"]) {
  const src = join(serverDir, entry);
  if (!existsSync(src)) continue;
  cpSync(src, join(outDir, entry), { recursive: true });
}

const size = statSync(join(outDir, "_libs", "eve.mjs")).size;
console.log(
  `Vendored eve bundle → ${outDir} (eve.mjs ${(size / 1024 / 1024).toFixed(1)} MB)`,
);
