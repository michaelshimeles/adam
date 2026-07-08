export function timeAgo(ms: number, now: number = Date.now()): string {
  const delta = Math.max(0, now - ms);
  if (delta < 5_000) return "just now";
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return `${Math.floor(delta / 86_400_000)}d ago`;
}

export function duration(startMs?: number, endMs?: number): string {
  if (startMs === undefined) return "—";
  const delta = (endMs ?? Date.now()) - startMs;
  if (delta < 1_000) return `${delta}ms`;
  if (delta < 60_000) return `${(delta / 1000).toFixed(1)}s`;
  return `${Math.floor(delta / 60_000)}m ${Math.floor((delta % 60_000) / 1000)}s`;
}

export function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Short display name for eve's internal workflow names. */
export function workflowLabel(name: string): string {
  const cleaned = name.replace(/^workflow\/\//, "").replace(/\/\//g, " · ");
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned;
}

export function shortId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 9)}…${id.slice(-4)}` : id;
}
