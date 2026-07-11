// Uploads the vendored eve bundle (eve-runtime/bundle) into the deployment's
// Convex file storage and activates it as the current eveBundles manifest.
// This is how the agent runtime reaches deployments whose node actions run
// off this machine (Convex Cloud) — runner/bundle.ts downloads the active
// manifest to /tmp and imports it there.
//
// Usage:
//   CONVEX_URL=https://<name>.convex.cloud \
//   WORLD_SERVICE_SECRET=<secret> node scripts/upload-bundle.mjs
//
// Idempotent: if the active manifest already matches the local bundle's
// content hash, nothing is uploaded.

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";

const here = dirname(fileURLToPath(import.meta.url));
const bundleDir = resolve(here, "..", "eve-runtime", "bundle");

const url = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const secret = process.env.WORLD_SERVICE_SECRET;
if (!secret) {
  console.error("Set WORLD_SERVICE_SECRET (must match the deployment's env).");
  process.exit(1);
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const paths = (await walk(bundleDir)).sort();
if (paths.length === 0) {
  console.error(`No files found in ${bundleDir}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const files = await Promise.all(
  paths.map(async (full) => {
    const bytes = await readFile(full);
    return {
      path: relative(bundleDir, full).split("\\").join("/"),
      bytes,
      size: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }),
);

// Content-addressed version: stable across identical uploads.
const version = createHash("sha256")
  .update(files.map((f) => `${f.path}\0${f.sha256}\n`).join(""))
  .digest("hex")
  .slice(0, 16);

const client = new ConvexHttpClient(url);

const active = await client.query("bundles:getActiveVersion", { secret });
if (active === version) {
  console.log(`Bundle ${version} is already active on ${url} — nothing to do.`);
  process.exit(0);
}

const totalMb = files.reduce((n, f) => n + f.size, 0) / 1024 / 1024;
console.log(
  `Uploading bundle ${version} (${files.length} files, ${totalMb.toFixed(1)} MB) → ${url}`,
);

const manifest = [];
for (const file of files) {
  const uploadUrl = await client.mutation("bundles:startUpload", { secret });
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: file.bytes,
  });
  if (!res.ok) {
    console.error(`✗ upload failed for ${file.path}: ${res.status}`);
    process.exit(1);
  }
  const { storageId } = await res.json();
  manifest.push({
    path: file.path,
    storageId,
    size: file.size,
    sha256: file.sha256,
  });
  console.log(`  ↑ ${file.path} (${(file.size / 1024).toFixed(0)} KB)`);
}

await client.mutation("bundles:commit", { secret, version, files: manifest });
console.log(`✓ bundle ${version} committed and active (was: ${active ?? "none"})`);
