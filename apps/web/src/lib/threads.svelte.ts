/**
 * Chat thread index, persisted in localStorage. Each thread maps to one eve
 * session on the deployment; the session id + continuation token are stored
 * on the thread meta so switching threads resumes the right session.
 */

export interface ThreadMeta {
  id: string;
  title: string;
  updatedAt: number;
  pinned?: boolean;
  /** Set once the user renames a thread, so auto-titles stop overwriting it. */
  renamed?: boolean;
  sessionId?: string;
  continuationToken?: string;
}

export interface ThreadSection {
  label: string | null;
  threads: ThreadMeta[];
}

const THREADS_KEY = "eve-web-threads";

function newThreadMeta(): ThreadMeta {
  return { id: crypto.randomUUID(), title: "New chat", updatedAt: Date.now() };
}

interface ThreadIndex {
  activeId: string;
  threads: ThreadMeta[];
}

function loadIndex(): ThreadIndex {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ThreadIndex;
      if (Array.isArray(parsed.threads) && parsed.threads.length > 0) {
        const activeId = parsed.threads.some((t) => t.id === parsed.activeId)
          ? parsed.activeId
          : parsed.threads[0].id;
        return { activeId, threads: parsed.threads };
      }
    }
  } catch {
    // fall through to a fresh index
  }
  const meta = newThreadMeta();
  return { activeId: meta.id, threads: [meta] };
}

function dateGroup(timestamp: number): "Today" | "Yesterday" | "Older" {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return "Older";
}

export function toThreadTitle(text: string): string {
  const oneLine = text.replaceAll("\n", " ").trim();
  return oneLine.length > 44 ? `${oneLine.slice(0, 44).trimEnd()}…` : oneLine;
}

export function createThreadStore() {
  const initial = loadIndex();
  let threads = $state<ThreadMeta[]>(initial.threads);
  let activeId = $state<string>(initial.activeId);

  function persist(): void {
    try {
      localStorage.setItem(
        THREADS_KEY,
        JSON.stringify({ activeId, threads }),
      );
    } catch {
      // storage unavailable — threads just won't survive reloads
    }
  }

  const active = $derived(threads.find((t) => t.id === activeId) ?? threads[0]);

  function sections(query: string): ThreadSection[] {
    const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
    const needle = query.trim().toLowerCase();
    if (needle.length > 0) {
      return [
        {
          label: null,
          threads: sorted.filter((t) => t.title.toLowerCase().includes(needle)),
        },
      ];
    }
    const groups = new Map<string, ThreadMeta[]>([
      ["Pinned", []],
      ["Today", []],
      ["Yesterday", []],
      ["Older", []],
    ]);
    for (const thread of sorted) {
      groups.get(thread.pinned ? "Pinned" : dateGroup(thread.updatedAt))!.push(thread);
    }
    return [...groups.entries()]
      .filter(([, list]) => list.length > 0)
      .map(([label, list]) => ({ label, threads: list }));
  }

  function select(id: string): void {
    if (!threads.some((t) => t.id === id)) return;
    activeId = id;
    persist();
  }

  function create(): ThreadMeta {
    // Reuse an existing empty thread instead of stacking blank ones.
    const blank = threads.find((t) => !t.sessionId && t.title === "New chat");
    if (blank) {
      activeId = blank.id;
      persist();
      return blank;
    }
    const meta = newThreadMeta();
    threads = [meta, ...threads];
    activeId = meta.id;
    persist();
    return meta;
  }

  function update(id: string, patch: Partial<ThreadMeta>): void {
    threads = threads.map((t) => (t.id === id ? { ...t, ...patch } : t));
    persist();
  }

  function remove(id: string): void {
    threads = threads.filter((t) => t.id !== id);
    if (threads.length === 0) {
      const meta = newThreadMeta();
      threads = [meta];
    }
    if (activeId === id) activeId = threads[0].id;
    persist();
  }

  return {
    get threads() {
      return threads;
    },
    get activeId() {
      return activeId;
    },
    get active() {
      return active;
    },
    sections,
    select,
    create,
    update,
    remove,
  };
}
