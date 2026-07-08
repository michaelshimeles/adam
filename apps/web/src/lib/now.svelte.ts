/** Shared 5s-tick clock so relative timestamps stay fresh across the app. */

let now = $state(Date.now());

if (typeof window !== "undefined") {
  setInterval(() => {
    now = Date.now();
  }, 5_000);
}

export function getNow(): number {
  return now;
}
