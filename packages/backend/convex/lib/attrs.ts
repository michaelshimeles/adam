import { worldError } from "./errors";

/**
 * Port of @workflow/world attribute validation (attributes.ts), kept in
 * sync with the SDK constants so world-convex enforces the same limits as
 * world-postgres / the Vercel world.
 */

export const RESERVED_ATTRIBUTE_KEY_PREFIX = "$";
export const ATTRIBUTE_KEY_MAX_LENGTH = 256;
export const ATTRIBUTE_VALUE_MAX_BYTES = 256;
export const ATTRIBUTE_MAX_PER_RUN = 64;

export interface AttributeChange {
  key: string;
  value: string | null;
}

function fail(message: string): never {
  worldError("ATTRIBUTE_VALIDATION", message);
}

function validateKey(key: string, allowReserved: boolean): void {
  if (typeof key !== "string") {
    fail(`Attribute key must be a string, got ${typeof key}`);
  }
  if (key.length === 0) {
    fail("Attribute key must not be empty");
  }
  if (key.length > ATTRIBUTE_KEY_MAX_LENGTH) {
    fail(
      `Attribute key length ${key.length} exceeds limit ${ATTRIBUTE_KEY_MAX_LENGTH}: ${JSON.stringify(key.slice(0, 32))}…`,
    );
  }
  if (!allowReserved && key.startsWith(RESERVED_ATTRIBUTE_KEY_PREFIX)) {
    fail(
      `Attribute key ${JSON.stringify(key)} starts with reserved prefix "${RESERVED_ATTRIBUTE_KEY_PREFIX}" — that namespace is reserved for framework/library code.`,
    );
  }
}

function validateValue(value: string | null): void {
  if (value === null) return;
  if (typeof value !== "string") {
    fail(`Attribute value must be a string or null, got ${typeof value}`);
  }
  const bytes = new TextEncoder().encode(value).length;
  if (bytes > ATTRIBUTE_VALUE_MAX_BYTES) {
    fail(
      `Attribute value byte length ${bytes} exceeds limit ${ATTRIBUTE_VALUE_MAX_BYTES}`,
    );
  }
}

export function validateAttributeChanges(
  changes: AttributeChange[],
  context: { existingKeys?: string[]; allowReservedAttributes?: boolean } = {},
): void {
  const seenKeys = new Set<string>();
  const existingKeys =
    context.existingKeys === undefined ? undefined : new Set(context.existingKeys);
  let netAdds = 0;
  let netDeletes = 0;
  for (const change of changes) {
    validateKey(change.key, context.allowReservedAttributes === true);
    validateValue(change.value);
    if (seenKeys.has(change.key)) {
      fail(
        `Attribute key ${JSON.stringify(change.key)} appears more than once in the same batch`,
      );
    }
    seenKeys.add(change.key);
    if (change.value !== null) {
      if (existingKeys === undefined || !existingKeys.has(change.key)) {
        netAdds += 1;
      }
    } else if (existingKeys === undefined || existingKeys.has(change.key)) {
      netDeletes += 1;
    }
  }
  const existing = existingKeys === undefined ? 0 : existingKeys.size;
  const postMerge = existing + netAdds - netDeletes;
  if (postMerge > ATTRIBUTE_MAX_PER_RUN) {
    fail(
      `Run attribute count would exceed limit ${ATTRIBUTE_MAX_PER_RUN} (post-merge ${postMerge})`,
    );
  }
}

export function applyAttributeChanges(
  existing: Record<string, string> | undefined,
  changes: AttributeChange[],
): Record<string, string> {
  const next: Record<string, string> = { ...(existing ?? {}) };
  for (const { key, value } of changes) {
    if (value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  if (Object.keys(next).length > ATTRIBUTE_MAX_PER_RUN) {
    fail(`Run attribute count would exceed limit ${ATTRIBUTE_MAX_PER_RUN}`);
  }
  return next;
}
