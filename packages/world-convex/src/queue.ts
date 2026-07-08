import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import {
  MessageId,
  parseQueueName,
  type Queue,
  type QueuePrefix,
  ValidQueueName,
} from "@workflow/world";
import { z } from "zod/v4";
import { ulid } from "ulid";
import type { ConvexWorldClient } from "./client.js";
import { fns } from "./client.js";
import type { ConvexWorldConfig } from "./config.js";
import {
  jsonReviver,
  serializeQueueBody,
  stringifyTypedJson,
} from "./typedjson.js";

/**
 * Convex-backed durable queue.
 *
 * enqueue → `world/queue:enqueue` (pending row, jobKey upsert semantics)
 *
 * The pump (started by `world.start()`) subscribes to the reactive
 * `world/queue:wake` query. Whenever a pending job is due it claims a batch
 * (leased, serializable mutation — no double claims) and delivers each job
 * over HTTP to the eve host's workflow endpoints:
 *
 *   POST {base}/.well-known/workflow/v1/flow   (workflow queue)
 *   POST {base}/.well-known/workflow/v1/step   (step queue)
 *
 * Handler responses drive the job lifecycle exactly like world-postgres:
 *   200 {timeoutSeconds} → reschedule (sleep / retryAfter wake-ups)
 *   200                  → complete (row deleted)
 *   5xx/4xx              → fail (backoff; dead-letter after maxFails)
 *   transport error      → release (no failure consumed; pump pauses until
 *                          the host's health endpoint answers again)
 */

const WORKFLOW_ROUTE_BASE = "/.well-known/workflow/v1";
const FAIL_BACKOFF_MS = 5_000;
const RELEASE_BACKOFF_MS = 1_000;
const HEALTH_POLL_INTERVAL_MS = 250;

const ClaimedJob = z.object({
  jobId: z.string(),
  queueName: z.string(),
  messageId: z.string(),
  payloadJson: z.string(),
  headersJson: z.string().optional(),
  idempotencyKey: z.string().optional(),
  jobKey: z.string().optional(),
  attempt: z.number(),
  failCount: z.number(),
  maxFails: z.number(),
});
type ClaimedJob = z.infer<typeof ClaimedJob>;

export type ConvexQueue = Queue & {
  start(): Promise<void>;
  close(): Promise<void>;
};

export function createQueue(
  client: ConvexWorldClient,
  config: ConvexWorldConfig,
): ConvexQueue {
  const workerId = `worker_${randomUUID()}`;
  const closeController = new AbortController();
  const closeSignal = closeController.signal;

  let unsubscribeWake: (() => void) | null = null;
  let wakeTimer: ReturnType<typeof setTimeout> | null = null;
  let draining = false;
  let drainRequested = false;
  const inflight = new Set<Promise<void>>();
  let startPromise: Promise<void> | null = null;

  // -- enqueue ---------------------------------------------------------------

  const queue: Queue["queue"] = async (queueName, message, opts) => {
    const { prefix, id } = parseQueueName(queueName);
    const messageId = MessageId.parse(`msg_${ulid()}`);
    const payloadJson = stringifyTypedJson(message)!;
    await client.mutation(fns.queueEnqueue, {
      queueName,
      queuePrefix: prefix,
      queueId: id,
      messageId,
      payloadJson,
      headersJson: opts?.headers ? JSON.stringify(opts.headers) : undefined,
      idempotencyKey: opts?.idempotencyKey,
      jobKey: opts?.idempotencyKey ?? messageId,
      delayMs:
        typeof opts?.delaySeconds === "number" && opts.delaySeconds > 0
          ? opts.delaySeconds * 1000
          : undefined,
    });
    return { messageId };
  };

  // -- HTTP delivery ----------------------------------------------------------

  function routeFor(queueName: string): "flow" | "step" {
    return parseQueueName(queueName as ValidQueueName).kind === "workflow"
      ? "flow"
      : "step";
  }

  function endpointUrl(route: "flow" | "step"): string {
    return `${config.targetBaseUrl.replace(/\/+$/, "")}${WORKFLOW_ROUTE_BASE}/${route}`;
  }

  async function hostIsHealthy(): Promise<boolean> {
    try {
      const res = await fetch(
        `${config.targetBaseUrl.replace(/\/+$/, "")}${WORKFLOW_ROUTE_BASE}/flow?__health`,
        { method: "GET", signal: AbortSignal.timeout(1_000) },
      );
      return res.status < 500;
    } catch {
      return false;
    }
  }

  async function waitForHost(): Promise<void> {
    while (!closeSignal.aborted && !(await hostIsHealthy())) {
      await sleep(HEALTH_POLL_INTERVAL_MS, undefined, {
        signal: closeSignal,
        ref: false,
      }).catch(() => {});
    }
  }

  type DeliveryOutcome =
    | { type: "completed" }
    | { type: "reschedule"; timeoutSeconds: number }
    | { type: "handlerError"; status: number; text: string }
    | { type: "transportError"; error: string };

  async function deliverOverHttp(job: ClaimedJob): Promise<DeliveryOutcome> {
    const extraHeaders = job.headersJson
      ? (JSON.parse(job.headersJson) as Record<string, string>)
      : {};
    const headers: Record<string, string> = {
      ...extraHeaders,
      "content-type": "application/json",
      "x-vqs-queue-name": job.queueName,
      "x-vqs-message-id": job.messageId,
      "x-vqs-message-attempt": String(job.failCount + 1),
    };
    let response: Response;
    try {
      response = await fetch(endpointUrl(routeFor(job.queueName)), {
        method: "POST",
        headers,
        body: job.payloadJson,
      });
    } catch (err) {
      return { type: "transportError", error: String(err) };
    }
    const text = await response.text();
    if (!response.ok) {
      return { type: "handlerError", status: response.status, text };
    }
    try {
      const timeoutSeconds = Number(JSON.parse(text).timeoutSeconds);
      if (Number.isFinite(timeoutSeconds) && timeoutSeconds >= 0) {
        return { type: "reschedule", timeoutSeconds };
      }
    } catch {}
    return { type: "completed" };
  }

  async function processJob(job: ClaimedJob): Promise<void> {
    // Keep the lease alive for long-running handlers (LLM steps can exceed
    // the base lease comfortably).
    const heartbeat = setInterval(() => {
      client
        .mutation(fns.queueHeartbeat, {
          jobId: job.jobId,
          workerId,
          leaseMs: config.leaseMs,
        })
        .catch(() => {});
    }, Math.max(10_000, config.leaseMs / 3));
    heartbeat.unref?.();

    try {
      const outcome = await deliverOverHttp(job);
      switch (outcome.type) {
        case "completed":
          await client.mutation(fns.queueComplete, {
            jobId: job.jobId,
            workerId,
          });
          return;
        case "reschedule":
          await client.mutation(fns.queueReschedule, {
            jobId: job.jobId,
            workerId,
            delayMs: outcome.timeoutSeconds * 1000,
          });
          return;
        case "handlerError": {
          console.error(
            `[world-convex] queue delivery failed (HTTP ${outcome.status})`,
            { queueName: job.queueName, messageId: job.messageId, error: outcome.text.slice(0, 500) },
          );
          const result = await client.mutation<{ dead: boolean }>(
            fns.queueFail,
            {
              jobId: job.jobId,
              workerId,
              error: outcome.text.slice(0, 2_000),
              backoffMs: FAIL_BACKOFF_MS,
            },
          );
          if (result.dead) {
            console.error(
              `[world-convex] queue job dead-lettered after ${job.maxFails} failures`,
              { queueName: job.queueName, messageId: job.messageId },
            );
          }
          return;
        }
        case "transportError":
          if (closeSignal.aborted) {
            // Shutting down: hand the claim back immediately.
            await client
              .mutation(fns.queueRelease, {
                jobId: job.jobId,
                workerId,
                delayMs: 0,
              })
              .catch(() => {});
            return;
          }
          console.warn(
            "[world-convex] eve host unreachable, releasing job and waiting for health",
            { queueName: job.queueName, error: outcome.error },
          );
          await client.mutation(fns.queueRelease, {
            jobId: job.jobId,
            workerId,
            delayMs: RELEASE_BACKOFF_MS,
          });
          await waitForHost();
          return;
      }
    } finally {
      clearInterval(heartbeat);
    }
  }

  // -- pump -------------------------------------------------------------------

  async function drain(): Promise<void> {
    if (draining) {
      drainRequested = true;
      return;
    }
    draining = true;
    try {
      do {
        drainRequested = false;
        while (!closeSignal.aborted) {
          const capacity = config.queueConcurrency - inflight.size;
          if (capacity <= 0) {
            await Promise.race(inflight);
            continue;
          }
          const claimed = await client.mutation<ClaimedJob[]>(fns.queueClaim, {
            workerId,
            now: Date.now(),
            max: capacity,
            leaseMs: config.leaseMs,
          });
          if (claimed.length === 0) break;
          for (const raw of claimed) {
            const job = ClaimedJob.parse(raw);
            const task = processJob(job)
              .catch((err) => {
                console.error("[world-convex] queue job processing crashed", {
                  messageId: job.messageId,
                  error: String(err),
                });
              })
              .finally(() => {
                inflight.delete(task);
              });
            inflight.add(task);
          }
        }
      } while (drainRequested && !closeSignal.aborted);
    } finally {
      draining = false;
    }
  }

  function scheduleWake(nextRunAfter: number | null): void {
    if (wakeTimer) {
      clearTimeout(wakeTimer);
      wakeTimer = null;
    }
    if (nextRunAfter === null || closeSignal.aborted) return;
    const delay = Math.max(0, nextRunAfter - Date.now());
    if (delay === 0) {
      void drain();
      return;
    }
    wakeTimer = setTimeout(() => {
      wakeTimer = null;
      void drain();
    }, Math.min(delay, 2_147_483_647));
    wakeTimer.unref?.();
  }

  async function start(): Promise<void> {
    // Must not block: eve awaits world.start() while the process that serves
    // our delivery target (and its health endpoint) is still booting.
    // Waiting for host health here would deadlock the boot. Deliveries that
    // race the boot fail as transport errors, which release the claim and
    // wait for health before the pump continues.
    if (startPromise) return startPromise;
    startPromise = (async () => {
      if (closeSignal.aborted) return;
      unsubscribeWake = client.subscriber.onUpdate(
        fns.queueWake as any,
        { secret: client.secret },
        (result: { nextRunAfter: number } | null) => {
          scheduleWake(result ? result.nextRunAfter : null);
        },
        (err: unknown) => {
          console.error("[world-convex] wake subscription error", err);
        },
      );
    })();
    return startPromise;
  }

  const createQueueHandler: Queue["createQueueHandler"] = (
    prefix: QueuePrefix,
    handler,
  ) => {
    const HeaderParser = z.object({
      "x-vqs-queue-name": ValidQueueName,
      "x-vqs-message-id": MessageId,
      "x-vqs-message-attempt": z.coerce.number(),
    });
    return async (req: Request): Promise<Response> => {
      const headers = HeaderParser.safeParse(Object.fromEntries(req.headers));
      if (!headers.success || !req.body) {
        return Response.json(
          {
            error: !req.body
              ? "Missing request body"
              : "Missing required headers",
          },
          { status: 400 },
        );
      }
      const queueName = headers.data["x-vqs-queue-name"];
      const messageId = headers.data["x-vqs-message-id"];
      const attempt = headers.data["x-vqs-message-attempt"];
      if (!queueName.startsWith(prefix)) {
        return Response.json({ error: "Unhandled queue" }, { status: 400 });
      }
      const text = await req.text();
      const body = JSON.parse(text, jsonReviver);
      try {
        const result = await handler(body, { attempt, queueName, messageId });
        if (typeof result?.timeoutSeconds === "number") {
          return Response.json({ timeoutSeconds: result.timeoutSeconds });
        }
        return Response.json({ ok: true });
      } catch (error) {
        return Response.json(String(error), { status: 500 });
      }
    };
  };

  const getDeploymentId: Queue["getDeploymentId"] = async () => "convex";

  return {
    queue,
    createQueueHandler,
    getDeploymentId,
    start,
    async close() {
      closeController.abort();
      if (wakeTimer) clearTimeout(wakeTimer);
      unsubscribeWake?.();
      unsubscribeWake = null;
      await Promise.allSettled([...inflight]);
    },
  };
}

// Re-export for tests
export { serializeQueueBody };
