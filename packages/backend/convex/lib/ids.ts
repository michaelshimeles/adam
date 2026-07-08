/**
 * Minimal monotonic ULID factory for the Convex runtime.
 *
 * Convex's deterministic isolate seeds Math.random per execution, which is
 * sufficient for uniqueness of the 80-bit random component. Monotonicity is
 * guaranteed within a single mutation execution (incrementing the random
 * component when the millisecond timestamp repeats), matching the ordering
 * guarantees world-postgres gets from the `ulid` npm package.
 */

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(now: number): string {
  let out = "";
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = now % 32;
    out = ENCODING[mod] + out;
    now = (now - mod) / 32;
  }
  return out;
}

function randomChars(): number[] {
  const chars: number[] = [];
  for (let i = 0; i < RANDOM_LEN; i++) {
    chars.push(Math.floor(Math.random() * 32));
  }
  return chars;
}

export function monotonicUlidFactory(): (now: number) => string {
  let lastTime = -1;
  let lastRandom: number[] = [];

  return (now: number): string => {
    if (now === lastTime) {
      // Increment the random component (with carry) for same-ms calls.
      for (let i = RANDOM_LEN - 1; i >= 0; i--) {
        const val = lastRandom[i] ?? 0;
        if (val < 31) {
          lastRandom[i] = val + 1;
          break;
        }
        lastRandom[i] = 0;
      }
    } else {
      lastTime = now;
      lastRandom = randomChars();
    }
    return encodeTime(now) + lastRandom.map((c) => ENCODING[c]).join("");
  };
}

const ULID_RE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;

/** Decode the 48-bit millisecond timestamp from a ULID, or null if invalid. */
export function ulidTimestamp(maybeUlid: string): number | null {
  if (!ULID_RE.test(maybeUlid)) return null;
  let time = 0;
  for (const char of maybeUlid.slice(0, TIME_LEN).toUpperCase()) {
    time = time * 32 + ENCODING.indexOf(char);
  }
  return time;
}

const PAST_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const FUTURE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Port of @workflow/world's validateUlidTimestamp: client-provided run IDs
 * must embed a timestamp within 24h in the past / 5min in the future.
 * Returns null when valid, else an error message.
 */
export function validateUlidTimestamp(
  prefixedUlid: string,
  prefix: string,
  now: number,
): string | null {
  const raw = prefixedUlid.startsWith(prefix)
    ? prefixedUlid.slice(prefix.length)
    : prefixedUlid;
  const ts = ulidTimestamp(raw);
  if (ts === null) {
    return `Invalid runId: "${prefixedUlid}" is not a valid ULID`;
  }
  const diffMs = now - ts;
  if (diffMs > 0 && diffMs <= PAST_THRESHOLD_MS) return null;
  if (diffMs <= 0 && -diffMs <= FUTURE_THRESHOLD_MS) return null;
  const driftSeconds = Math.round(Math.abs(diffMs) / 1000);
  const direction = diffMs > 0 ? "past" : "future";
  const thresholdSeconds = Math.round(
    (diffMs > 0 ? PAST_THRESHOLD_MS : FUTURE_THRESHOLD_MS) / 1000,
  );
  return `Invalid runId timestamp: embedded timestamp is ${driftSeconds}s in the ${direction} (threshold: ${thresholdSeconds}s)`;
}
