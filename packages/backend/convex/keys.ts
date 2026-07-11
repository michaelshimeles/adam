import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import {
  modelProviderValidator,
  normalizeProvider,
  type ModelProvider,
} from "./lib/modelKeys";

/**
 * BYOK (bring your own key) support for the public demo.
 *
 * The dashboard is public, but model calls must not spend the deployment
 * owner's credits. Visitors supply their own key — a Vercel AI Gateway key
 * or an OpenRouter key; chat:send records it (with its provider) against
 * the session's run id and the runner (runner/engine:tick) injects it into
 * the environment before delivering that session's jobs. Sessions started
 * by the deployment itself (the hourly heartbeat schedule) are marked
 * `system` and keep using the deployment's own credentials
 * (AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN / OPENROUTER_API_KEY).
 *
 * Keys are stored in plaintext in this table while their sessions exist —
 * inherent to executing the agent server-side with a caller-supplied
 * credential. A daily cron drops rows once they go stale so keys don't
 * accumulate. Nothing here is ever exposed through a public query.
 */

const GATEWAY_ORIGIN = "https://ai-gateway.vercel.sh";
const OPENROUTER_ORIGIN = "https://openrouter.ai";
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** Upsert the model API key for a (user-initiated) session. */
export const put = internalMutation({
  args: {
    sessionId: v.string(),
    apiKey: v.string(),
    provider: v.optional(modelProviderValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const provider = normalizeProvider(args.provider);
    const existing = await ctx.db
      .query("sessionKeys")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        provider,
        system: false,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("sessionKeys", {
        sessionId: args.sessionId,
        apiKey: args.apiKey,
        provider,
        system: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

/** Mark a session as deployment-initiated: it runs on the owner's env key. */
export const markSystem = internalMutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("sessionKeys")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { system: true, updatedAt: now });
    } else {
      await ctx.db.insert("sessionKeys", {
        sessionId: args.sessionId,
        system: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

/**
 * Batch lookup for the runner: which key does each claimed run use?
 *
 * Chat keys are stored under the SESSION run id, but eve executes each turn
 * as a child workflow run — the job's own runId differs from the session's.
 * The session id travels as the `$eve.root` run attribute: the runner passes
 * it when the job payload carries runInput (first delivery), and redeliveries
 * fall back to the run row's stored attributes here.
 */
export const resolveMany = internalQuery({
  args: {
    jobs: v.array(
      v.object({
        runId: v.string(),
        /** `$eve.root` from the job payload's runInput, when present. */
        root: v.optional(v.string()),
      }),
    ),
  },
  returns: v.array(
    v.object({
      runId: v.string(),
      apiKey: v.optional(v.string()),
      provider: modelProviderValidator,
      system: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const results = [];
    for (const job of args.jobs) {
      let sessionId = job.root ?? null;
      if (!sessionId) {
        const run = await ctx.db
          .query("runs")
          .withIndex("by_runId", (q) => q.eq("runId", job.runId))
          .unique();
        if (run) {
          try {
            const attributes = JSON.parse(run.attributesJson) as Record<
              string,
              unknown
            >;
            const root = attributes["$eve.root"];
            if (typeof root === "string") sessionId = root;
          } catch {
            // malformed attributes — fall through to the run id itself
          }
        }
      }
      // Session entry runs have no $eve.root: they ARE the session.
      sessionId ??= job.runId;

      const doc = await ctx.db
        .query("sessionKeys")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      if (doc) {
        results.push({
          runId: job.runId,
          apiKey: doc.apiKey,
          provider: normalizeProvider(doc.provider),
          system: doc.system,
        });
      }
    }
    return results;
  },
});

/** Cron: drop key rows that haven't been touched in a week. */
export const cleanup = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cutoff = Date.now() - STALE_AFTER_MS;
    const stale = await ctx.db
      .query("sessionKeys")
      .withIndex("by_updatedAt", (q) => q.lt("updatedAt", cutoff))
      .take(500);
    for (const doc of stale) {
      await ctx.db.delete(doc._id);
    }
    return stale.length;
  },
});

interface KeyCheck {
  ok: boolean;
  balance?: string;
  error?: string;
}

/**
 * Both providers expose an authenticated GET that answers 200 for any valid
 * key: the gateway's credits endpoint (which reports a balance) and
 * OpenRouter's key-info endpoint (which reports the key's remaining credit
 * limit, when one is set).
 */
async function checkKey(
  provider: ModelProvider,
  apiKey: string,
): Promise<KeyCheck> {
  const target =
    provider === "openrouter"
      ? { url: `${OPENROUTER_ORIGIN}/api/v1/key`, label: "OpenRouter" }
      : { url: `${GATEWAY_ORIGIN}/v1/credits`, label: "The AI Gateway" };

  let response: Response;
  try {
    response = await fetch(target.url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch {
    return { ok: false, error: `Could not reach ${target.label}.` };
  }
  if (!response.ok) {
    return {
      ok: false,
      error:
        response.status === 401 || response.status === 403
          ? `${target.label} rejected this key.`
          : `${target.label} returned ${response.status}.`,
    };
  }
  try {
    const json = (await response.json()) as {
      balance?: unknown;
      data?: { limit_remaining?: unknown };
    };
    if (provider === "openrouter") {
      const remaining = json.data?.limit_remaining;
      return {
        ok: true,
        balance: typeof remaining === "number" ? String(remaining) : undefined,
      };
    }
    return {
      ok: true,
      balance: typeof json.balance === "string" ? json.balance : undefined,
    };
  } catch {
    return { ok: true };
  }
}

/**
 * Check a visitor's key against its provider before letting them into the
 * dashboard. Runs server-side because neither provider's key endpoint
 * allows browser CORS.
 */
export const validate = action({
  args: {
    apiKey: v.string(),
    provider: v.optional(modelProviderValidator),
  },
  returns: v.object({
    ok: v.boolean(),
    balance: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const apiKey = args.apiKey.trim();
    if (!apiKey) return { ok: false, error: "Enter an API key." };
    return await checkKey(normalizeProvider(args.provider), apiKey);
  },
});
