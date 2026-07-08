import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

/**
 * Direct Convex access for authored tools. This is the same deployment that
 * backs the workflow world, so agent data (notes) and durable run state live
 * side by side and the dashboard reads both reactively.
 */

export function convexClient(): ConvexHttpClient {
  const url = process.env.CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

export function serviceSecret(): string {
  const secret = process.env.WORLD_SERVICE_SECRET;
  if (!secret) throw new Error("WORLD_SERVICE_SECRET is not set");
  return secret;
}

/** Untyped function refs (the backend package owns the real types). */
export const backend = {
  notesAdd: anyApi.notes.add,
  notesList: anyApi.notes.list,
  notesClear: anyApi.notes.clear,
  queueHealth: anyApi.ui.queueHealth,
  listRuns: anyApi.ui.listRuns,
};
