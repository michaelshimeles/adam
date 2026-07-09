import { useConvexClient } from "convex-svelte";
import {
  defaultMessageReducer,
  type ClientInputRespondedEvent,
  type EveAgentReducerEvent,
  type EveMessageData,
  type HandleMessageStreamEvent,
  type InputResponse,
} from "eve/client";
import { onDestroy } from "svelte";
import { chatApi, type SessionEventsPage } from "./api";
import { gatewayKey } from "./apiKey.svelte";

/**
 * Convex-native replacement for eve's useEveAgent hook.
 *
 * useEveAgent talks HTTP+SSE to a running eve server. Here there is no
 * server: sends go through the `chat:send` Convex action (which drives the
 * bundled eve runtime inside a Convex node action), and the transcript is a
 * reactive subscription to `ui:sessionEvents` — the session's durable event
 * stream decoded server-side. Every projection eve ships for its own UIs
 * (defaultMessageReducer) is reused unchanged on top of that subscription,
 * so the rendered message shapes are identical to useEveAgent's.
 */

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface PendingMessage {
  submissionId: string;
  message: string;
  createdAt: number;
  failed?: string;
}

interface PersistedSession {
  sessionId: string;
  continuationToken?: string;
}

const STORAGE_KEY = "eve-convex-chat-session";

function loadPersisted(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    return typeof parsed.sessionId === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function createChatSession() {
  const client = useConvexClient();
  const reducer = defaultMessageReducer();

  const persisted = loadPersisted();

  let sessionId = $state<string | null>(persisted?.sessionId ?? null);
  let continuationToken: string | undefined = persisted?.continuationToken;
  let serverEvents = $state<HandleMessageStreamEvent[]>([]);
  let pending = $state<PendingMessage[]>([]);
  let inputEvents = $state<ClientInputRespondedEvent[]>([]);
  let sendInFlight = $state(false);
  let errorMessage = $state<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  function persist(): void {
    try {
      if (sessionId) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ sessionId, continuationToken }),
        );
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage unavailable (private mode etc.) — session just won't survive reloads
    }
  }

  /** Requests still awaiting a user response in the current projection. */
  function pendingApprovalIds(data: EveMessageData): Set<string> {
    const ids = new Set<string>();
    for (const message of data.messages) {
      for (const part of message.parts) {
        if (
          part.type === "dynamic-tool" &&
          part.state === "approval-requested"
        ) {
          ids.add(part.approval.id);
        }
      }
    }
    return ids;
  }

  const data = $derived.by<EveMessageData>(() => {
    let acc = reducer.initial();
    for (const event of serverEvents) {
      acc = reducer.reduce(acc, event);
    }
    // Optimistic user messages not yet confirmed by a message.received event.
    for (const p of pending) {
      const event: EveAgentReducerEvent = p.failed
        ? {
            type: "client.message.failed",
            data: {
              createdAt: p.createdAt,
              error: { message: p.failed },
              message: p.message,
              submissionId: p.submissionId,
            },
          }
        : {
            type: "client.message.submitted",
            data: {
              createdAt: p.createdAt,
              message: p.message,
              submissionId: p.submissionId,
            },
          };
      acc = reducer.reduce(acc, event);
    }
    // Locally-submitted HITL responses, but only while the request is still
    // open server-side — once action.result lands, replaying the client event
    // would clobber the terminal part state.
    const open = pendingApprovalIds(acc);
    for (const event of inputEvents) {
      if (event.data.responses.some((r) => open.has(r.requestId))) {
        acc = reducer.reduce(acc, event);
      }
    }
    return acc;
  });

  const status = $derived.by<ChatStatus>(() => {
    if (errorMessage) return "error";
    if (sendInFlight) return "submitted";
    if (pending.some((p) => !p.failed)) return "submitted";
    const last = serverEvents[serverEvents.length - 1];
    if (!last) return "ready";
    if (
      last.type === "session.waiting" ||
      last.type === "session.completed" ||
      last.type === "session.failed"
    ) {
      return "ready";
    }
    return "streaming";
  });

  function handlePage(page: SessionEventsPage | null): void {
    if (!page) return;
    const events = page.events as HandleMessageStreamEvent[];
    serverEvents = events;
    // Drop optimistic messages the server has confirmed.
    if (pending.length > 0) {
      const received = new Set(
        events
          .filter((e) => e.type === "message.received")
          .map((e) => (e.data as { message: string }).message),
      );
      pending = pending.filter((p) => p.failed || !received.has(p.message));
    }
    // Drop replayed HITL responses whose request has resolved.
    if (inputEvents.length > 0) {
      let acc = reducer.initial();
      for (const event of events) acc = reducer.reduce(acc, event);
      const open = pendingApprovalIds(acc);
      inputEvents = inputEvents.filter((e) =>
        e.data.responses.some((r) => open.has(r.requestId)),
      );
    }
  }

  function subscribe(id: string): void {
    unsubscribe?.();
    unsubscribe = client.onUpdate(
      chatApi.sessionEvents,
      { sessionId: id },
      (page) => handlePage(page),
      (err) => {
        errorMessage = `session stream: ${err.message}`;
      },
    );
  }

  // Resume the persisted session (plain value, not the $state proxy — this
  // runs once at setup and must not register a reactive read).
  if (persisted?.sessionId) subscribe(persisted.sessionId);
  onDestroy(() => unsubscribe?.());

  async function send(input: {
    message?: string;
    inputResponses?: InputResponse[];
  }): Promise<void> {
    if (sendInFlight) return;
    // BYOK: the send action requires the visitor's gateway key. The
    // dashboard's key dialog normally guarantees this exists.
    const apiKey = gatewayKey.value;
    if (!apiKey) {
      errorMessage = "Add your AI Gateway API key (topbar) to chat.";
      return;
    }
    errorMessage = null;
    const submissionId = crypto.randomUUID();
    if (input.message !== undefined) {
      pending = [
        ...pending,
        {
          submissionId,
          message: input.message,
          createdAt: Date.now(),
        },
      ];
    }
    if (input.inputResponses && input.inputResponses.length > 0) {
      inputEvents = [
        ...inputEvents,
        {
          type: "client.input.responded",
          data: {
            createdAt: Date.now(),
            responses: input.inputResponses,
          },
        },
      ];
    }
    sendInFlight = true;
    try {
      const result = await client.action(chatApi.send, {
        apiKey,
        ...(sessionId ? { sessionId } : {}),
        ...(input.message !== undefined ? { message: input.message } : {}),
        ...(input.inputResponses && input.inputResponses.length > 0
          ? { inputResponses: input.inputResponses }
          : {}),
        ...(sessionId && continuationToken ? { continuationToken } : {}),
      });
      if (!result.ok) {
        throw new Error(result.error ?? `chat send failed (${result.status})`);
      }
      if (result.sessionId && result.sessionId !== sessionId) {
        sessionId = result.sessionId;
        subscribe(result.sessionId);
      }
      if (result.continuationToken) {
        continuationToken = result.continuationToken;
      }
      persist();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errorMessage = message;
      if (input.message !== undefined) {
        pending = pending.map((p) =>
          p.submissionId === submissionId ? { ...p, failed: message } : p,
        );
      }
    } finally {
      sendInFlight = false;
    }
  }

  function reset(): void {
    unsubscribe?.();
    unsubscribe = null;
    sessionId = null;
    continuationToken = undefined;
    serverEvents = [];
    pending = [];
    inputEvents = [];
    errorMessage = null;
    persist();
  }

  return {
    get data() {
      return data;
    },
    get status() {
      return status;
    },
    get error() {
      return errorMessage;
    },
    get sessionId() {
      return sessionId;
    },
    send,
    reset,
  };
}
