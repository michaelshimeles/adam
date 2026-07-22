import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServiceSecret } from "./lib/auth";

/**
 * Receipt tracking (spending log). Money is stored as integer cents; the
 * agent's tools speak in dollars. Writes carry the world service secret;
 * reads are public for the dashboard.
 */

const receiptValidator = v.object({
  id: v.id("receipts"),
  merchant: v.string(),
  /** Dollars, two decimals. */
  total: v.number(),
  currency: v.string(),
  category: v.string(),
  purchasedAt: v.string(),
  items: v.union(v.string(), v.null()),
  notes: v.union(v.string(), v.null()),
});

type ReceiptDoc = {
  _id: import("./_generated/dataModel").Id<"receipts">;
  merchant: string;
  totalCents: number;
  currency: string;
  category: string;
  purchasedAt: string;
  itemsJson?: string;
  notes?: string;
};

function publicRow(row: ReceiptDoc) {
  return {
    id: row._id,
    merchant: row.merchant,
    total: Math.round(row.totalCents) / 100,
    currency: row.currency,
    category: row.category,
    purchasedAt: row.purchasedAt,
    items: row.itemsJson ?? null,
    notes: row.notes ?? null,
  };
}

export const log = mutation({
  args: {
    secret: v.string(),
    merchant: v.string(),
    totalCents: v.number(),
    currency: v.string(),
    category: v.string(),
    purchasedAt: v.string(),
    itemsJson: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: receiptValidator,
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const id = await ctx.db.insert("receipts", {
      merchant: args.merchant,
      totalCents: Math.round(args.totalCents),
      currency: args.currency,
      category: args.category,
      purchasedAt: args.purchasedAt,
      itemsJson: args.itemsJson,
      notes: args.notes,
      loggedAt: Date.now(),
    });
    const row = await ctx.db.get(id);
    return publicRow(row as ReceiptDoc);
  },
});

export const remove = mutation({
  args: { secret: v.string(), id: v.id("receipts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    requireServiceSecret(args.secret);
    const row = await ctx.db.get(args.id);
    if (row === null) return false;
    await ctx.db.delete(args.id);
    return true;
  },
});

/** Receipts in a date range (ISO YYYY-MM-DD, inclusive), optionally filtered. */
export const listRange = query({
  args: {
    from: v.string(),
    to: v.string(),
    category: v.optional(v.string()),
    merchant: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(receiptValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);
    const rows = await ctx.db
      .query("receipts")
      .withIndex("by_purchasedAt", (q) =>
        q.gte("purchasedAt", args.from).lte("purchasedAt", args.to),
      )
      .order("desc")
      .take(500);
    const merchant = args.merchant?.toLowerCase();
    return rows
      .filter(
        (row) =>
          (args.category === undefined || row.category === args.category) &&
          (merchant === undefined ||
            row.merchant.toLowerCase().includes(merchant)),
      )
      .slice(0, limit)
      .map((row) => publicRow(row as ReceiptDoc));
  },
});

/** Spend per category over a date range, in dollars. */
export const summary = query({
  args: { from: v.string(), to: v.string() },
  returns: v.object({
    total: v.number(),
    count: v.number(),
    byCategory: v.array(
      v.object({ category: v.string(), total: v.number(), count: v.number() }),
    ),
  }),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("receipts")
      .withIndex("by_purchasedAt", (q) =>
        q.gte("purchasedAt", args.from).lte("purchasedAt", args.to),
      )
      .take(2000);
    const byCategory = new Map<string, { cents: number; count: number }>();
    let cents = 0;
    for (const row of rows) {
      cents += row.totalCents;
      const bucket = byCategory.get(row.category) ?? { cents: 0, count: 0 };
      bucket.cents += row.totalCents;
      bucket.count += 1;
      byCategory.set(row.category, bucket);
    }
    return {
      total: Math.round(cents) / 100,
      count: rows.length,
      byCategory: Array.from(byCategory, ([category, bucket]) => ({
        category,
        total: Math.round(bucket.cents) / 100,
        count: bucket.count,
      })).sort((a, b) => b.total - a.total),
    };
  },
});
