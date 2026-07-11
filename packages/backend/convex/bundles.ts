import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";
import { worldError } from "./lib/errors";

/**
 * Bundle delivery for deployments whose node actions don't share this
 * machine's filesystem (Convex Cloud). scripts/upload-bundle.mjs pushes the
 * vendored eve bundle (eve-runtime/bundle) into Convex file storage through
 * these mutations; runner/bundle.ts materializes the active manifest into
 * /tmp at execution time.
 *
 * Like the world/* functions these are trusted machine-to-machine endpoints,
 * guarded by WORLD_SERVICE_SECRET rather than end-user auth.
 */

const manifestFile = v.object({
  path: v.string(),
  storageId: v.id("_storage"),
  size: v.number(),
  sha256: v.string(),
});

/** Paths are joined under /tmp by the runner — keep them strictly relative. */
function assertSafePath(path: string): void {
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((seg) => seg === "" || seg === "." || seg === "..")
  ) {
    worldError("WORLD_ERROR", `Invalid bundle file path: ${path}`);
  }
}

/** One storage upload URL per call; the script POSTs the file bytes to it. */
export const startUpload = mutation({
  args: { secret: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Record an uploaded bundle as the active manifest. Replaces the previous
 * active manifest; superseded manifests (beyond the immediately previous
 * one, kept for rollback) are deleted along with their storage files.
 */
export const commit = mutation({
  args: {
    secret: v.string(),
    version: v.string(),
    files: v.array(manifestFile),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    if (args.files.length === 0) {
      worldError("WORLD_ERROR", "Bundle manifest has no files");
    }
    for (const file of args.files) assertSafePath(file.path);

    const existing = await ctx.db
      .query("eveBundles")
      .withIndex("by_version", (q) => q.eq("version", args.version))
      .unique();
    if (existing) {
      worldError(
        "WORLD_ERROR",
        `Bundle version ${args.version} already exists`,
      );
    }

    // All rows, oldest first: deactivate the current active manifest and
    // prune everything except the one we just superseded.
    const rows = await ctx.db.query("eveBundles").collect();
    rows.sort((a, b) => a.createdAt - b.createdAt);
    const previousActive = rows.filter((row) => row.active);
    for (const row of previousActive) {
      await ctx.db.patch(row._id, { active: false });
    }
    const keep = new Set(previousActive.map((row) => row._id));
    for (const row of rows) {
      if (keep.has(row._id)) continue;
      for (const file of row.files) {
        await ctx.storage.delete(file.storageId);
      }
      await ctx.db.delete(row._id);
    }

    await ctx.db.insert("eveBundles", {
      version: args.version,
      files: args.files,
      active: true,
      createdAt: Date.now(),
    });
    return null;
  },
});

/** Currently-active manifest version, for upload idempotency checks. */
export const getActiveVersion = query({
  args: { secret: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const active = await ctx.db
      .query("eveBundles")
      .withIndex("by_active", (q) => q.eq("active", true))
      .unique();
    return active?.version ?? null;
  },
});

/** The runner's view: which bundle to materialize and execute. */
export const activeManifest = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      version: v.string(),
      files: v.array(manifestFile),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const active = await ctx.db
      .query("eveBundles")
      .withIndex("by_active", (q) => q.eq("active", true))
      .unique();
    if (!active) return null;
    return { version: active.version, files: active.files };
  },
});
