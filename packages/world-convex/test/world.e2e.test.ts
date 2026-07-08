/**
 * End-to-end verification of the Convex-backed World against a real local
 * Convex deployment (packages/backend pushed to `npx convex dev`).
 *
 * Prereqs (see repo README):
 *   cd packages/backend && CONVEX_AGENT_MODE=anonymous npx convex dev
 *   npx convex env set WORLD_SERVICE_SECRET dev-world-secret
 *
 * Run: CONVEX_URL=http://127.0.0.1:3210 WORLD_SERVICE_SECRET=dev-world-secret pnpm test
 */
import { createServer, type Server } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { World } from "@workflow/world";
import { createWorld } from "../src/index.js";

const CONVEX_URL = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const SECRET = process.env.WORLD_SERVICE_SECRET ?? "dev-world-secret";

// ---------------------------------------------------------------------------
// Fake eve host: receives queue deliveries like the Nitro workflow endpoints
// ---------------------------------------------------------------------------

type Delivery = {
  route: string;
  headers: Record<string, string>;
  body: string;
};

class FakeHost {
  deliveries: Delivery[] = [];
  /** route+messageId → response override (status, body) */
  respond: (d: Delivery) => { status: number; body: unknown } = () => ({
    status: 200,
    body: { ok: true },
  });
  private server: Server | null = null;
  port = 0;

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      if (req.method === "GET") {
        // health probe
        res.writeHead(200).end("ok");
        return;
      }
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        const delivery: Delivery = {
          route: req.url ?? "",
          headers: Object.fromEntries(
            Object.entries(req.headers).map(([k, v]) => [k, String(v)]),
          ),
          body: data,
        };
        this.deliveries.push(delivery);
        const { status, body } = this.respond(delivery);
        res
          .writeHead(status, { "content-type": "application/json" })
          .end(JSON.stringify(body));
      });
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(0, "127.0.0.1", resolve),
    );
    const addr = this.server!.address();
    if (typeof addr === "object" && addr) this.port = addr.port;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}

async function waitFor<T>(
  fn: () => Promise<T | undefined | false>,
  { timeoutMs = 15_000, intervalMs = 100 } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() > deadline) throw new Error("waitFor: timed out");
    await sleep(intervalMs);
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------

let host: FakeHost;
let world: World;

beforeAll(async () => {
  host = new FakeHost();
  await host.start();
  world = createWorld({
    convexUrl: CONVEX_URL,
    serviceSecret: SECRET,
    targetBaseUrl: `http://127.0.0.1:${host.port}`,
    queueConcurrency: 4,
    leaseMs: 15_000,
    streamFlushIntervalMs: 10,
  });
  await world.start?.();
});

afterAll(async () => {
  await world.close?.();
  await host.stop();
});

describe("storage: run lifecycle", () => {
  it("creates, starts, steps and completes a run with TypedJSON payloads", async () => {
    const binary = new Uint8Array([1, 2, 3, 250]);
    const created = await world.events.create(null, {
      eventType: "run_created",
      eventData: {
        deploymentId: "dpl_test",
        workflowName: "wf/test",
        input: [{ text: "hello", blob: binary }],
        attributes: { tenant: "acme" },
      },
    });
    expect(created.run).toBeDefined();
    const runId = created.run!.runId;
    expect(runId).toMatch(/^wrun_/);
    expect(created.run!.status).toBe("pending");

    // Input round-trips through TypedJSON, including the Uint8Array
    const fetched = await world.runs.get(runId);
    const input = fetched.input as Array<Record<string, unknown>>;
    expect(input[0]!.text).toBe("hello");
    expect(new Uint8Array(input[0]!.blob as Uint8Array)).toEqual(binary);
    expect(fetched.attributes).toMatchObject({ tenant: "acme" });

    // run_started returns the preloaded event log
    const started = await world.events.create(runId, {
      eventType: "run_started",
      eventData: {},
    });
    expect(started.run!.status).toBe("running");
    expect(started.events!.map((e) => e.eventType)).toEqual([
      "run_created",
      "run_started",
    ]);

    // step lifecycle
    const stepId = `step_${uid()}`;
    await world.events.create(runId, {
      eventType: "step_created",
      correlationId: stepId,
      eventData: { stepName: "llm.call", input: [{ prompt: "hi" }] },
    });
    await world.events.create(runId, {
      eventType: "step_started",
      correlationId: stepId,
      eventData: {},
    });
    const when = new Date("2026-01-02T03:04:05.000Z");
    const stepDone = await world.events.create(runId, {
      eventType: "step_completed",
      correlationId: stepId,
      eventData: { result: { answer: 42, at: when } },
    });
    expect(stepDone.step!.status).toBe("completed");
    const step = await world.steps.get(runId, stepId);
    expect(step.attempt).toBe(1);
    expect((step.output as Record<string, unknown>).answer).toBe(42);

    // complete the run
    const done = await world.events.create(runId, {
      eventType: "run_completed",
      eventData: { output: { result: "ok" } },
    });
    expect(done.run!.status).toBe("completed");
    expect(done.run!.completedAt).toBeInstanceOf(Date);

    // event log ordering
    const events = await world.events.list({ runId });
    expect(events.data.map((e) => e.eventType)).toEqual([
      "run_created",
      "run_started",
      "step_created",
      "step_started",
      "step_completed",
      "run_completed",
    ]);

    // steps listing
    const steps = await world.steps.list({ runId });
    expect(steps.data).toHaveLength(1);
    expect(steps.data[0]!.stepId).toBe(stepId);
  });

  it("maps missing entities onto typed workflow errors", async () => {
    await expect(world.runs.get("wrun_does_not_exist")).rejects.toMatchObject({
      name: "WorkflowRunNotFoundError",
    });
  });

  it("supports hooks create/getByToken/dispose", async () => {
    const created = await world.events.create(null, {
      eventType: "run_created",
      eventData: { deploymentId: "dpl_test", workflowName: "wf/hooks", input: [] },
    });
    const runId = created.run!.runId;
    await world.events.create(runId, { eventType: "run_started", eventData: {} });

    const hookId = `hook_${uid()}`;
    const token = `tok_${uid()}`;
    const hooked = await world.events.create(runId, {
      eventType: "hook_created",
      correlationId: hookId,
      eventData: { token, metadata: { kind: "approval" } },
    });
    expect(hooked.hook!.token).toBe(token);

    const byToken = await world.hooks.getByToken(token);
    expect(byToken.hookId).toBe(hookId);
    expect(byToken.runId).toBe(runId);

    // duplicate hook_created for the same (runId, hookId) → EntityConflictError
    await expect(
      world.events.create(runId, {
        eventType: "hook_created",
        correlationId: hookId,
        eventData: { token },
      }),
    ).rejects.toMatchObject({ name: "EntityConflictError" });

    // duplicate token from another run → hook_conflict event (spec behavior:
    // recorded, not thrown, so the awaiting workflow fails gracefully)
    const other = await world.events.create(null, {
      eventType: "run_created",
      eventData: { deploymentId: "dpl_test", workflowName: "wf/hooks2", input: [] },
    });
    await world.events.create(other.run!.runId, {
      eventType: "run_started",
      eventData: {},
    });
    const conflict = await world.events.create(other.run!.runId, {
      eventType: "hook_created",
      correlationId: `hook_${uid()}`,
      eventData: { token },
    });
    expect(conflict.event!.eventType).toBe("hook_conflict");

    await world.events.create(runId, {
      eventType: "hook_disposed",
      correlationId: hookId,
      eventData: {},
    });
    await expect(world.hooks.getByToken(token)).rejects.toMatchObject({
      name: "HookNotFoundError",
    });
  });
});

describe("queue: delivery over HTTP with lease lifecycle", () => {
  it("delivers workflow messages to the flow endpoint and completes them", async () => {
    host.deliveries = [];
    host.respond = () => ({ status: 200, body: { ok: true } });

    const payload = { runId: "wrun_x", bytes: new Uint8Array([9, 8, 7]) };
    const { messageId } = await world.queue(`__wkf_workflow_${uid()}`, payload);
    expect(messageId).toMatch(/^msg_/);

    const delivery = await waitFor(async () =>
      host.deliveries.find(
        (d) => d.headers["x-vqs-message-id"] === messageId,
      ),
    );
    expect(delivery.route).toBe("/.well-known/workflow/v1/flow");
    // TypedJSON payload encodes the Uint8Array
    expect(JSON.parse(delivery.body).bytes.__type).toBe("Uint8Array");
    expect(delivery.headers["x-vqs-message-attempt"]).toBe("1");
  });

  it("retries failed deliveries with backoff and counts attempts", async () => {
    host.deliveries = [];
    let calls = 0;
    host.respond = () => {
      calls += 1;
      return calls === 1
        ? { status: 500, body: { error: "boom" } }
        : { status: 200, body: { ok: true } };
    };

    const { messageId } = await world.queue(`__wkf_step_${uid()}`, { n: 1 });
    await waitFor(
      async () =>
        host.deliveries.filter(
          (d) => d.headers["x-vqs-message-id"] === messageId,
        ).length >= 2,
      { timeoutMs: 30_000 },
    );
    const attempts = host.deliveries
      .filter((d) => d.headers["x-vqs-message-id"] === messageId)
      .map((d) => d.headers["x-vqs-message-attempt"]);
    expect(attempts).toEqual(["1", "2"]);
  }, 40_000);

  it("reschedules when the handler asks for a timeout", async () => {
    host.deliveries = [];
    let calls = 0;
    host.respond = () => {
      calls += 1;
      return calls === 1
        ? { status: 200, body: { timeoutSeconds: 1 } }
        : { status: 200, body: { ok: true } };
    };

    const { messageId } = await world.queue(`__wkf_workflow_${uid()}`, {});
    await waitFor(
      async () =>
        host.deliveries.filter(
          (d) => d.headers["x-vqs-message-id"] === messageId,
        ).length >= 2,
      { timeoutMs: 30_000 },
    );
    // Redelivery keeps attempt=1: a sleep is not a failure.
    const attempts = host.deliveries
      .filter((d) => d.headers["x-vqs-message-id"] === messageId)
      .map((d) => d.headers["x-vqs-message-attempt"]);
    expect(attempts).toEqual(["1", "1"]);
  }, 40_000);

  it("delivers delayed messages only after the delay", async () => {
    host.deliveries = [];
    host.respond = () => ({ status: 200, body: { ok: true } });
    const t0 = Date.now();
    const { messageId } = await world.queue(
      `__wkf_workflow_${uid()}`,
      { delayed: true },
      { delaySeconds: 2 },
    );
    await waitFor(
      async () =>
        host.deliveries.find(
          (d) => d.headers["x-vqs-message-id"] === messageId,
        ),
      { timeoutMs: 30_000 },
    );
    expect(Date.now() - t0).toBeGreaterThanOrEqual(1_900);
  }, 40_000);

  it("createQueueHandler decodes TypedJSON bodies and validates headers", async () => {
    const received: unknown[] = [];
    const handler = world.createQueueHandler("__wkf_step_", async (msg, meta) => {
      received.push({ msg, meta });
      return undefined;
    });
    const queueName = `__wkf_step_${uid()}`;
    const res = await handler(
      new Request("http://localhost/.well-known/workflow/v1/step", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vqs-queue-name": queueName,
          "x-vqs-message-id": "msg_01ARZ3NDEKTSV4RRFFQ69G5FAV",
          "x-vqs-message-attempt": "1",
        },
        body: JSON.stringify({
          data: { __type: "Uint8Array", data: "AQID" },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const first = received[0] as {
      msg: { data: Uint8Array };
      meta: { queueName: string; attempt: number };
    };
    expect(first.msg.data).toBeInstanceOf(Uint8Array);
    expect([...first.msg.data]).toEqual([1, 2, 3]);
    expect(first.meta.queueName).toBe(queueName);
    expect(first.meta.attempt).toBe(1);
  });
});

describe("streams: buffered writes + live tailing", () => {
  it("round-trips chunks through getChunks", async () => {
    const runId = `wrun_stream_${uid()}`;
    await world.streams.write(runId, "out", "hello ");
    await world.streams.write(runId, "out", new Uint8Array([240, 159, 146, 150]));
    await world.streams.close(runId, "out");

    const page = await world.streams.getChunks(runId, "out");
    expect(page.done).toBe(true);
    const text = Buffer.concat(page.data.map((c) => c.data)).toString("utf8");
    expect(text).toBe("hello 💖");

    const info = await world.streams.getInfo(runId, "out");
    expect(info).toMatchObject({ tailIndex: 1, done: true });
    expect(await world.streams.list(runId)).toContain("out");
  });

  it("tails a live stream over the subscription", async () => {
    const runId = `wrun_stream_${uid()}`;
    const readable = await world.streams.get(runId, "live");
    const reader = readable.getReader();
    const decoder = new TextDecoder();
    const seen: string[] = [];
    const readAll = (async () => {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        seen.push(decoder.decode(value));
      }
    })();

    await world.streams.write(runId, "live", "one|");
    await sleep(150);
    await world.streams.writeMulti(runId, "live", ["two|", "three|"]);
    await world.streams.close(runId, "live");

    await readAll;
    expect(seen.join("")).toBe("one|two|three|");
  }, 20_000);

  it("supports reading from an offset", async () => {
    const runId = `wrun_stream_${uid()}`;
    await world.streams.writeMulti(runId, "log", ["a", "b", "c"]);
    await world.streams.close(runId, "log");

    const fromSecond = await world.streams.get(runId, "log", 1);
    const reader = fromSecond.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    expect(text).toBe("bc");
  }, 20_000);
});
