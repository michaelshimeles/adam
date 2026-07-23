import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * Agent-created event triggers (webhooks): each row is an inbound HTTP
 * endpoint with a stored instruction. convex/http.ts receives POSTs at
 * /hooks/<hookId>/<secret> and forwards into the agent's hooks channel,
 * which verifies the secret against the row and wakes the agent with the
 * stored prompt plus the event payload.
 *
 * The full row (including the secret) is only returned to callers holding
 * the world service secret; the dashboard's public list omits it.
 */

const triggerValidator = v.object({
  hookId: v.string(),
  secret: v.string(),
  name: v.string(),
  prompt: v.string(),
  chatId: v.union(v.string(), v.null()),
  fireCount: v.number(),
  lastFiredAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
});

type TriggerDoc = {
  hookId: string;
  secret: string;
  name: string;
  prompt: string;
  chatId: string | null;
  fireCount: number;
  lastFiredAt?: number;
  createdAt: number;
};

function fullRow(row: TriggerDoc) {
  return {
    hookId: row.hookId,
    secret: row.secret,
    name: row.name,
    prompt: row.prompt,
    chatId: row.chatId,
    fireCount: row.fireCount,
    lastFiredAt: row.lastFiredAt ?? null,
    createdAt: row.createdAt,
  };
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const create = mutation({
  args: {
    secret: v.string(),
    name: v.string(),
    prompt: v.string(),
    chatId: v.union(v.string(), v.null()),
  },
  returns: triggerValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = {
      hookId: `whk_${randomHex(6)}`,
      secret: randomHex(24),
      name: args.name,
      prompt: args.prompt,
      chatId: args.chatId,
      fireCount: 0,
      createdAt: Date.now(),
    };
    await ctx.db.insert("triggers", row);
    return fullRow(row);
  },
});

/** Full rows (with secrets) for the agent's list_webhooks tool. */
export const listFull = mutation({
  args: { secret: v.string() },
  returns: v.array(triggerValidator),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const rows = await ctx.db.query("triggers").take(200);
    return rows.map((row) => fullRow(row as TriggerDoc));
  },
});

export const get = mutation({
  args: { secret: v.string(), hookId: v.string() },
  returns: v.union(triggerValidator, v.null()),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db
      .query("triggers")
      .withIndex("by_hookId", (q) => q.eq("hookId", args.hookId))
      .unique();
    return row === null ? null : fullRow(row as TriggerDoc);
  },
});

export const remove = mutation({
  args: { secret: v.string(), hookId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db
      .query("triggers")
      .withIndex("by_hookId", (q) => q.eq("hookId", args.hookId))
      .unique();
    if (row === null) return false;
    await ctx.db.delete(row._id);
    return true;
  },
});

export const recordFire = mutation({
  args: { secret: v.string(), hookId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db
      .query("triggers")
      .withIndex("by_hookId", (q) => q.eq("hookId", args.hookId))
      .unique();
    if (row !== null) {
      await ctx.db.patch(row._id, {
        fireCount: row.fireCount + 1,
        lastFiredAt: Date.now(),
      });
    }
    return null;
  },
});

/** Secret-free listing for the dashboard. */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      hookId: v.string(),
      name: v.string(),
      fireCount: v.number(),
      lastFiredAt: v.union(v.number(), v.null()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("triggers").take(200);
    return rows.map((row) => ({
      hookId: row.hookId,
      name: row.name,
      fireCount: row.fireCount,
      lastFiredAt: row.lastFiredAt ?? null,
      createdAt: row.createdAt,
    }));
  },
});
