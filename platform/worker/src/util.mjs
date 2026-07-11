import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

/**
 * Child env for pipeline commands: the operator's shell may carry Convex/eve
 * context (CONVEX_DEPLOYMENT, EVE_BUNDLE_PATH, …) that must never leak into
 * per-agent builds or deploys.
 */
export function childEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of [
    "CONVEX_DEPLOYMENT",
    "CONVEX_URL",
    "CONVEX_DEPLOY_KEY",
    "CONVEX_AGENT_MODE",
    "EVE_BUNDLE_PATH",
    "EVE_AGENT_NAME",
    "WORLD_SERVICE_SECRET",
    "WORLD_EXECUTION_MODE",
    "WORKFLOW_QUEUE_NAMESPACE",
    "VERCEL_OIDC_TOKEN",
    "AI_GATEWAY_API_KEY",
  ]) {
    delete env[key];
  }
  // eve requires node >= 24; prefer the keg-only homebrew install if present.
  const node24 = "/opt/homebrew/opt/node@24/bin";
  if (existsSync(node24) && !String(env.PATH ?? "").includes(node24)) {
    env.PATH = `${node24}:${env.PATH}`;
  }
  return { ...env, ...extra };
}

/**
 * Run a command, streaming stdout+stderr line-by-line into `log`. Rejects on
 * non-zero exit or timeout. Resolves with the full captured output.
 */
export function run(cmd, args, { cwd, env, log, label, timeoutMs = 5 * 60_000 }) {
  const tag = label ?? cmd;
  log(`$ ${cmd} ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      env: env ?? childEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let out = "";
    let lineCount = 0;
    const partial = { stdout: "", stderr: "" };

    const emit = (line) => {
      const clean = line.replace(ANSI, "").trimEnd();
      if (clean.length === 0) return;
      lineCount += 1;
      if (lineCount === 500) {
        log(`[${tag}] … output truncated (500+ lines)`);
        return;
      }
      if (lineCount > 500) return;
      log(`[${tag}] ${clean.slice(0, 2000)}`);
    };

    const onChunk = (key) => (chunk) => {
      const text = chunk.toString("utf8");
      out += text;
      partial[key] += text;
      const lines = partial[key].split("\n");
      partial[key] = lines.pop() ?? "";
      for (const line of lines) emit(line);
    };

    child.stdout.on("data", onChunk("stdout"));
    child.stderr.on("data", onChunk("stderr"));

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${tag} timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      for (const key of ["stdout", "stderr"]) {
        if (partial[key]) emit(partial[key]);
      }
      if (code === 0) {
        resolve({ output: out });
      } else {
        const tail = out.split("\n").filter(Boolean).slice(-6).join(" | ");
        reject(new Error(`${tag} exited with code ${code}: ${tail.slice(0, 800)}`));
      }
    });
  });
}

export function randHex(bytes) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
