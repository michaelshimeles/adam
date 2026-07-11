import { exposeUploadApi } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

/**
 * Internal upload API for the static-hosting CLI (`static-hosting upload`).
 * These are internal functions — callable only with a deploy key.
 */
export const {
  generateUploadUrl,
  generateUploadUrls,
  recordAsset,
  recordAssets,
  gcOldAssets,
  listAssets,
} = exposeUploadApi(components.selfHosting);
