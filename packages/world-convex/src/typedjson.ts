/**
 * TypedJSON — the wire/storage encoding for opaque workflow payloads.
 *
 * Matches the JSON envelope used by world-local's filesystem storage and
 * world-postgres's queue transport:
 *
 *   Uint8Array → { "__type": "Uint8Array", "data": "<base64>" }
 *   Date       → ISO string (via JSON.stringify default)
 *
 * The Convex backend stores these strings opaquely; this module is the
 * only place the eve-host side encodes/decodes them.
 */

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, "base64"));
}

export function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { __type: "Uint8Array", data: toBase64(value) };
  }
  return value;
}

export function jsonReviver(_key: string, value: unknown): unknown {
  if (
    value !== null &&
    typeof value === "object" &&
    (value as Record<string, unknown>).__type === "Uint8Array" &&
    typeof (value as Record<string, unknown>).data === "string"
  ) {
    return fromBase64((value as { data: string }).data);
  }
  return value;
}

export function stringifyTypedJson(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return JSON.stringify(value, jsonReplacer);
}

export function parseTypedJson(json: string | undefined | null): unknown {
  if (json === undefined || json === null) return undefined;
  return JSON.parse(json, jsonReviver);
}

/** Encode a queue payload to bytes (HTTP body for the workflow endpoints). */
export function serializeQueueBody(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value, jsonReplacer));
}
