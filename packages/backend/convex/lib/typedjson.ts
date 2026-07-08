/**
 * TypedJSON: the wire/storage encoding for opaque workflow payloads.
 *
 * Matches the JSON envelope used by world-local / world-postgres queues:
 *   Uint8Array → { "__type": "Uint8Array", "data": "<base64>" }
 *
 * The Convex side mostly treats these strings as opaque, but the event
 * materialization logic needs to read scalar fields (workflowName, token,
 * resumeAt, ...) out of event data, so a parse helper lives here. Byte
 * markers are left as-is when re-serializing sub-values, which keeps the
 * encoding stable across extract/re-store cycles.
 */

export function parseTypedJson(json: string | undefined): any {
  if (json === undefined) return undefined;
  return JSON.parse(json);
}

export function stringifySubValue(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return JSON.stringify(value);
}

/** Read an ISO date string (a JSON-serialized Date) as epoch ms. */
export function isoToMs(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}
