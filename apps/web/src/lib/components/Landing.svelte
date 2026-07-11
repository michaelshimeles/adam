<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "../api";

  const health = useQuery(api.queueHealth, {});
  const runs = useQuery(api.listRuns, { limit: 100 });

  const completedRuns = $derived(
    runs.data ? runs.data.filter((r) => r.status === "completed").length : null,
  );

  const command = "git clone github.com/michaelshimeles/adam";

  let copied = $state(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      copied = true;
      setTimeout(() => (copied = false), 1400);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  const steps = [
    {
      n: "01",
      name: "compile",
      body: "eve build emits one self-contained bundle: agent loop, tools, Workflow runtime, world-convex. It gets vendored into the Convex deployment. The Nitro server is left on the floor.",
    },
    {
      n: "02",
      name: "execute",
      body: "eve's engine is stateless request/response under the hood. A “use node” action imports the bundle and calls the workflow handler in-process — no HTTP, no host.",
    },
    {
      n: "03",
      name: "deliver",
      body: "Queue mutations schedule a runner tick with ctx.scheduler.runAfter the moment a job becomes due. No polling, no pump. Crons sweep leases as a safety net.",
    },
    {
      n: "04",
      name: "chat",
      body: "chat:send invokes the bundled channel API the way eve's HTTP server would have. Transcripts are durable streams, decoded server-side into a plain reactive query.",
    },
    {
      n: "05",
      name: "schedule",
      body: "The agent's markdown schedules map to Convex crons. The hourly heartbeat starts real sessions that run through the same queue as everything else.",
    },
  ];

  const features = [
    {
      title: "Event-sourced runs",
      tag: "world/runs · steps · events · hooks",
      body: "Every workflow event lands in one transactional mutation that appends and materializes state together. Crash anywhere; replay deterministically.",
    },
    {
      title: "Scheduler-driven queue",
      tag: "queueJobs + ctx.scheduler",
      body: "Leased jobs with retries, backoff, idempotency keys and dead-lettering — woken by the Convex scheduler instead of a polling worker.",
    },
    {
      title: "Live token streams",
      tag: "streamChunks · ui:sessionEvents",
      body: "Model output flushes into ordered chunks; the binary framing is decoded in a Convex query, so the UI just subscribes.",
    },
    {
      title: "Human-in-the-loop",
      tag: "hooks · chat:send",
      body: "Tool approvals suspend the workflow on a durable hook. Answering from the UI resumes it — the round-trip never leaves Convex.",
    },
    {
      title: "Schedules as crons",
      tag: "heartbeat.md → crons.ts",
      body: "eve's croner never boots; deployment crons dispatch the same schedule tasks against the bundled runtime.",
    },
    {
      title: "UI from static hosting",
      tag: "convex.site",
      body: "This page and the dashboard are served by the deployment they describe, subscribed over one WebSocket.",
    },
  ];

  const removed = [
    ["Nitro HTTP server", "in-process function calls"],
    ["queue pump", "ctx.scheduler.runAfter"],
    ["SSE transport", "reactive Convex queries"],
    ["Postgres + Redis", "one Convex deployment"],
  ];

</script>

<div class="landing">
  <nav class="nav">
    <div class="nav-left">
      <span class="logo-mark">▲</span>
      <span class="logo-name">adam</span>
      <span class="slash">/</span>
      <span class="logo-eve">☰ eve</span>
      <span class="x">×</span>
      <span class="logo-convex">convex</span>
    </div>
    <div class="nav-right">
      <a class="nav-link" href="#how">How it works</a>
      <a class="nav-link" href="#arch">Architecture</a>
      <a
        class="nav-link"
        href="https://github.com/michaelshimeles/adam"
        target="_blank"
        rel="noreferrer">GitHub ↗</a
      >
      <a class="btn-white" href="#/dashboard">Open dashboard</a>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-text">
      <h1>The durable agent runtime,<br />all on Convex</h1>
      <p class="sub">
        adam takes <a href="https://eve.dev" target="_blank" rel="noreferrer">eve</a>
        — Vercel's agent framework — and executes its entire engine inside
        Convex. One deployment is the database, the queue, the scheduler, and
        the runtime. There is no server.
      </p>
    </div>

    <div class="run-block">
      <button class="cmd" onclick={copyCommand} title="Copy to clipboard">
        <span class="prompt">$</span>
        <span class="cmd-text">{command}</span>
        <span class="copy">{copied ? "copied" : "⧉"}</span>
      </button>
      <p class="cmd-note">that's the whole runtime — there is no step two</p>
    </div>

    <div class="live-strip">
      <span class="live-dot"></span>
      <span class="live-label">
        served by the deployment it describes —
        {#if health.data}
          queue {health.data.pending} pending · {health.data.claimed} in flight
          · {health.data.dead} dead{#if completedRuns !== null}&nbsp;· {completedRuns}
            runs completed{/if}
        {:else if health.error}
          convex offline
        {:else}
          connecting…
        {/if}
      </span>
    </div>
  </section>

  <section class="statement">
    <h2>Your <span class="chip">▤ convex/</span> is the runtime</h2>
    <p>
      eve says an agent is a directory — an <code>instructions.md</code>, some
      tools, a schedule. adam keeps that, then uses <code>eve build</code> as a
      compiler instead of a server: the emitted bundle is vendored into the
      deployment and every turn executes inside a Convex action. Durability
      between invocations is exactly the world state in Convex tables.
    </p>
  </section>

  <section class="how" id="how">
    <div class="section-head">
      <h3>How a message becomes a durable run</h3>
      <p>The eve HTTP server is gone; its protocol survives in-process.</p>
    </div>
    <div class="steps">
      {#each steps as step (step.n)}
        <article class="step">
          <div class="step-head">
            <span class="step-n">{step.n}</span>
            <span class="step-name">{step.name}</span>
          </div>
          <p>{step.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="grid-section">
    <div class="section-head">
      <h3>Everything durable, one deployment</h3>
      <p>The pieces eve normally spreads across a host, Postgres and Redis.</p>
    </div>
    <div class="features">
      {#each features as feature (feature.title)}
        <article class="feature">
          <h4>{feature.title}</h4>
          <code class="feature-tag">{feature.tag}</code>
          <p>{feature.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="removed">
    <div class="section-head">
      <h3>What's genuinely gone</h3>
    </div>
    <ul class="removed-list">
      {#each removed as [gone, instead] (gone)}
        <li>
          <span class="gone">✕ {gone}</span>
          <span class="arrow">→</span>
          <span class="instead">{instead}</span>
        </li>
      {/each}
    </ul>
    <p class="removed-note">
      What remains from Vercel: <code>eve build</code> as a compile step, and
      the AI&nbsp;Gateway for model credentials — or bring an OpenRouter key
      instead.
    </p>
  </section>

  <section class="arch" id="arch">
    <div class="section-head">
      <h3>Architecture</h3>
      <p>How a chat message flows through the deployment and back to this page.</p>
    </div>

    <div class="arch-flow">
      <div class="arch-box">
        <div class="arch-label">Convex deployment · packages/backend</div>

        <div class="flow-pair">
          <div class="node">
            <span class="node-name">chat:send</span>
            <span class="node-sub">action · "use node"</span>
          </div>
          <span class="h-arrow" aria-hidden="true">
            <span class="line"></span>
          </span>
          <div class="node">
            <span class="node-name">eve channel API</span>
            <span class="node-sub">bundled · in-process</span>
          </div>
        </div>

        <div class="v-arrow" aria-hidden="true">
          <span class="vline"></span>
          <span class="lbl">enqueue</span>
        </div>

        <div class="flow-pair">
          <div class="node">
            <span class="node-name">world/queue</span>
            <span class="node-sub">mutations</span>
          </div>
          <span class="h-arrow" aria-hidden="true">
            <span class="lbl">ctx.scheduler</span>
            <span class="line"></span>
          </span>
          <div class="node">
            <span class="node-name">runner/engine:tick</span>
            <span class="node-sub">action · "use node"</span>
          </div>
        </div>

        <div class="v-arrow" aria-hidden="true">
          <span class="vline"></span>
          <span class="lbl">imports the vendored eve bundle</span>
        </div>

        <div class="node center">
          <span class="node-name">workflow POST handler</span>
          <span class="node-sub">agent loop · models · tools</span>
        </div>

        <div class="v-arrow" aria-hidden="true">
          <span class="vline"></span>
          <span class="lbl">durable writes</span>
        </div>

        <div class="node wide">
          <div class="table-chips">
            <code>world/runs</code>
            <code>steps</code>
            <code>events</code>
            <code>hooks</code>
            <code>streams</code>
          </div>
          <span class="node-sub">crons: lease reaper · sweep · heartbeat schedule</span>
          <span class="node-sub">notes (app data) · static hosting (this page)</span>
        </div>
      </div>

      <div class="ws-link">
        <span class="vline up" aria-hidden="true"></span>
        <span class="ws-pill">
          <span class="ws-dot" aria-hidden="true"></span>
          convex-svelte · one WebSocket · all live
        </span>
        <span class="vline down" aria-hidden="true"></span>
      </div>

      <div class="node client">
        <span class="node-name">Svelte 5 dashboard — this site</span>
        <span class="node-sub">chat + HITL · notepad · runs / steps / streams</span>
      </div>
    </div>
  </section>

  <section class="cta">
    <h3>Talk to it</h3>
    <p>
      Ask it to save a note, check queue health, or clear the notepad and watch
      a human-in-the-loop approval suspend and resume a workflow.
    </p>
    <div class="cta-row">
      <a class="btn-white lg" href="#/dashboard">Open the dashboard →</a>
      <a
        class="btn-ghost lg"
        href="https://github.com/michaelshimeles/adam"
        target="_blank"
        rel="noreferrer">Read the code ↗</a
      >
    </div>
  </section>

  <footer class="footer">
    <span>eve 0.22 · convex · svelte 5</span>
    <span class="footer-sep">—</span>
    <span>a bold-AI-agent experiment: the whole thing, ported</span>
  </footer>
</div>

<style>
  .landing {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scroll-behavior: smooth;
    background:
      radial-gradient(900px 480px at 50% -8%, rgba(255, 255, 255, 0.05), transparent 65%),
      #050506;
    color: #ededf0;
  }

  /* ---------------- nav ---------------- */

  .nav {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--nav-h);
    padding: 0 26px;
    background: rgba(5, 5, 6, 0.72);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13.5px;
  }

  .logo-mark {
    font-size: 11px;
    transform: translateY(-1px);
  }

  .logo-name {
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .slash {
    color: #3c3c44;
  }

  .logo-eve {
    color: #c8c8ce;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .x {
    color: #4a4a52;
    font-size: 11px;
  }

  .logo-convex {
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .nav-link {
    color: #9a9aa4;
    text-decoration: none;
    font-size: 13px;
    transition: color 0.15s;
  }

  .nav-link:hover {
    color: #ededf0;
  }

  .btn-white {
    background: #fff;
    color: #0a0a0c;
    font-weight: 600;
    font-size: 13px;
    padding: 7px 15px;
    border-radius: 999px;
    text-decoration: none;
    transition:
      transform 0.12s,
      box-shadow 0.12s;
  }

  .btn-white:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.18);
  }

  .btn-white.lg,
  .btn-ghost.lg {
    font-size: 14.5px;
    padding: 11px 22px;
  }

  .btn-ghost {
    color: #c8c8ce;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    transition:
      border-color 0.15s,
      color 0.15s;
  }

  .btn-ghost:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  /* ---------------- hero ---------------- */

  .hero {
    padding: 96px 24px 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-text {
    position: relative;
    text-align: center;
    max-width: 640px;
    padding: 0 12px;
  }

  .hero-text h1 {
    margin: 0 0 18px;
    font-size: clamp(30px, 5vw, 46px);
    line-height: 1.14;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #fff;
  }

  .sub {
    margin: 0;
    color: #a7a7b2;
    font-size: 15.5px;
    line-height: 1.65;
  }

  .sub a {
    color: #d8d8de;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(255, 255, 255, 0.3);
  }

  /* ---------------- command pill ---------------- */

  .run-block {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .cmd {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: #0d0d10;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 12px 20px;
    font-family: var(--mono);
    font-size: 13.5px;
    color: #ededf0;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .cmd:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: #101014;
  }

  .prompt {
    color: #5a5a64;
  }

  .copy {
    color: #6a6a74;
    font-size: 12px;
    min-width: 44px;
    text-align: right;
  }

  .cmd-note {
    margin: 0;
    color: #55555e;
    font-size: 12px;
    letter-spacing: 0.02em;
  }

  /* ---------------- live strip ---------------- */

  .live-strip {
    margin-top: 46px;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 7px 16px;
    border-radius: 999px;
    border: 1px solid rgba(63, 206, 139, 0.22);
    background: rgba(63, 206, 139, 0.05);
    font-size: 12.5px;
    color: #9fb3a8;
    font-variant-numeric: tabular-nums;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 1.6s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ---------------- sections ---------------- */

  section {
    max-width: 980px;
    margin: 0 auto;
    padding: 72px 26px;
  }

  .statement {
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .statement h2 {
    margin: 0 0 20px;
    font-size: clamp(26px, 4.4vw, 40px);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #fff;
  }

  .chip {
    display: inline-block;
    background: #17171c;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 1px 12px 3px;
    font-family: var(--mono);
    font-size: 0.82em;
    color: #e2e2e8;
    transform: translateY(-2px);
  }

  .statement p {
    margin: 0 auto;
    max-width: 620px;
    color: #a7a7b2;
    font-size: 15px;
    line-height: 1.7;
  }

  .statement code,
  .removed-note code {
    font-family: var(--mono);
    font-size: 0.92em;
    background: #141419;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 1px 6px;
    color: #d8d8de;
  }

  .section-head {
    margin-bottom: 34px;
  }

  .section-head h3 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: #fff;
  }

  .section-head p {
    margin: 0;
    color: #8a8a94;
    font-size: 14px;
  }

  /* steps */

  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 14px;
  }

  .step {
    background: #0c0c0f;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 18px 18px 16px;
  }

  .step-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
  }

  .step-n {
    font-family: var(--mono);
    font-size: 11px;
    color: #55555e;
  }

  .step-name {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ededf0;
  }

  .step p {
    margin: 0;
    color: #9a9aa4;
    font-size: 13px;
    line-height: 1.6;
  }

  /* features */

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
  }

  .feature {
    background: #0c0c0f;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 18px;
    transition:
      border-color 0.18s,
      transform 0.18s;
  }

  .feature:hover {
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
  }

  .feature h4 {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 650;
    color: #fff;
  }

  .feature-tag {
    display: inline-block;
    font-family: var(--mono);
    font-size: 11px;
    color: #7c7c88;
    margin-bottom: 10px;
  }

  .feature p {
    margin: 0;
    color: #9a9aa4;
    font-size: 13px;
    line-height: 1.6;
  }

  /* removed */

  .removed-list {
    list-style: none;
    margin: 0 0 22px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 10px;
  }

  .removed-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #0c0c0f;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 13px 16px;
    font-size: 13px;
  }

  .gone {
    color: #d0d0d6;
    text-decoration: line-through;
    text-decoration-color: rgba(255, 98, 112, 0.65);
    text-decoration-thickness: 1.5px;
  }

  .arrow {
    color: #4a4a52;
  }

  .instead {
    color: var(--green);
    font-family: var(--mono);
    font-size: 12px;
  }

  .removed-note {
    margin: 0;
    color: #8a8a94;
    font-size: 13.5px;
  }

  /* architecture */

  .arch-flow {
    max-width: 760px;
    margin: 0 auto;
  }

  .arch-box {
    background: #08080a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 20px;
  }

  .arch-label {
    font-family: var(--mono);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a8a94;
    margin-bottom: 16px;
  }

  .node {
    display: flex;
    flex-direction: column;
    gap: 3px;
    background: #101014;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 10px 14px;
    min-width: 0;
  }

  .node-name {
    font-family: var(--mono);
    font-size: 12.5px;
    font-weight: 600;
    color: #ededf0;
    overflow-wrap: break-word;
  }

  .node-sub {
    font-family: var(--mono);
    font-size: 10.5px;
    color: #6a6a74;
    overflow-wrap: break-word;
  }

  .node.center {
    width: fit-content;
    margin: 0 auto;
    align-items: center;
    text-align: center;
    padding: 10px 22px;
  }

  .table-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .table-chips code {
    font-family: var(--mono);
    font-size: 11px;
    color: #d8d8de;
    background: #17171c;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 2px 8px;
  }

  .flow-pair {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
  }

  .h-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    min-width: 110px;
  }

  .h-arrow .lbl,
  .v-arrow .lbl {
    font-family: var(--mono);
    font-size: 10.5px;
    color: #6a6a74;
    white-space: nowrap;
  }

  .h-arrow .line {
    position: relative;
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.18);
  }

  .h-arrow .line::after {
    content: "";
    position: absolute;
    right: 0;
    top: -3px;
    border-left: 6px solid rgba(255, 255, 255, 0.4);
    border-top: 3.5px solid transparent;
    border-bottom: 3.5px solid transparent;
  }

  .v-arrow {
    position: relative;
    display: flex;
    justify-content: center;
    height: 40px;
    padding: 3px 0;
  }

  .v-arrow .vline {
    position: relative;
    width: 1px;
    background: rgba(255, 255, 255, 0.18);
  }

  .v-arrow .vline::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: -3px;
    border-top: 6px solid rgba(255, 255, 255, 0.4);
    border-left: 3.5px solid transparent;
    border-right: 3.5px solid transparent;
  }

  .v-arrow .lbl {
    position: absolute;
    left: calc(50% + 12px);
    top: 50%;
    transform: translateY(-50%);
  }

  .ws-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
  }

  .ws-link .vline {
    position: relative;
    width: 1px;
    height: 20px;
    background: rgba(63, 206, 139, 0.45);
  }

  .ws-link .vline.up::before {
    content: "";
    position: absolute;
    top: 0;
    left: -3px;
    border-bottom: 6px solid rgba(63, 206, 139, 0.8);
    border-left: 3.5px solid transparent;
    border-right: 3.5px solid transparent;
  }

  .ws-link .vline.down::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: -3px;
    border-top: 6px solid rgba(63, 206, 139, 0.8);
    border-left: 3.5px solid transparent;
    border-right: 3.5px solid transparent;
  }

  .ws-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid rgba(63, 206, 139, 0.22);
    background: rgba(63, 206, 139, 0.05);
    font-family: var(--mono);
    font-size: 11.5px;
    color: #9fb3a8;
  }

  .ws-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 1.6s ease-in-out infinite;
    flex-shrink: 0;
  }

  .node.client {
    width: fit-content;
    margin: 0 auto;
    align-items: center;
    text-align: center;
    padding: 12px 22px;
  }

  /* cta + footer */

  .cta {
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .cta h3 {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.015em;
  }

  .cta p {
    margin: 0 auto 28px;
    max-width: 520px;
    color: #a7a7b2;
    font-size: 14.5px;
    line-height: 1.65;
  }

  .cta-row {
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 26px 20px 40px;
    color: #55555e;
    font-size: 12.5px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    flex-wrap: wrap;
    text-align: center;
  }

  .footer-sep {
    color: #2e2e34;
  }

  /* responsive */

  @media (max-width: 720px) {
    .nav-link {
      display: none;
    }

    .nav {
      padding: 0 16px;
    }

    .hero {
      padding: 56px 16px 64px;
    }

    section {
      padding: 52px 18px;
    }

    .cmd {
      max-width: 100%;
      font-size: 12px;
      padding: 11px 16px;
      gap: 9px;
    }

    .cmd-text {
      overflow-wrap: anywhere;
      text-align: left;
    }

    .live-strip {
      max-width: 100%;
      font-size: 11.5px;
      line-height: 1.5;
      border-radius: 16px;
      padding: 8px 14px;
    }

    .arch-box {
      padding: 14px 12px;
    }

    .cta-row {
      flex-direction: column;
      align-items: stretch;
      max-width: 320px;
      margin: 0 auto;
    }

    .btn-white.lg,
    .btn-ghost.lg {
      text-align: center;
    }

    .flow-pair {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .h-arrow {
      flex-direction: row-reverse;
      justify-content: center;
      align-items: center;
      gap: 10px;
      min-width: 0;
      height: 40px;
      padding: 5px 0;
    }

    .h-arrow .line {
      width: 1px;
      height: 100%;
    }

    .h-arrow .line::after {
      right: auto;
      top: auto;
      bottom: 0;
      left: -3px;
      border-bottom: 0;
      border-left: 3.5px solid transparent;
      border-right: 3.5px solid transparent;
      border-top: 6px solid rgba(255, 255, 255, 0.4);
    }

    .v-arrow {
      flex-direction: column-reverse;
      align-items: center;
      height: auto;
      gap: 5px;
    }

    .v-arrow .vline {
      height: 22px;
    }

    .v-arrow .lbl {
      position: static;
      transform: none;
      white-space: normal;
      text-align: center;
      max-width: 90%;
    }
  }
</style>
