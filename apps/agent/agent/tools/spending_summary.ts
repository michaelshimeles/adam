import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient } from "../lib/convex";
import { DATE_MAX, DATE_MIN, type ReceiptRow } from "../lib/receipts";

const GROUPINGS: Record<string, (row: ReceiptRow) => string> = {
  category: (row) => row.category,
  merchant: (row) => row.merchant,
  month: (row) => row.purchasedAt.slice(0, 7),
};

export default defineTool({
  description:
    "Total spending grouped by category, merchant, or month, with an overall total. Use for questions like 'how much did I spend on groceries this year' or 'break down my July spending'.",
  inputSchema: z.object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Earliest purchase date, inclusive"),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Latest purchase date, inclusive"),
    group_by: z.enum(["category", "merchant", "month"]).default("category"),
  }),
  async execute({ from, to, group_by }) {
    const receipts = (await convexClient().query(backend.receiptsListRange, {
      from: from ?? DATE_MIN,
      to: to ?? DATE_MAX,
      limit: 500,
    })) as ReceiptRow[];

    const keyOf = GROUPINGS[group_by];
    const buckets = new Map<string, { total: number; receipts: number }>();
    let overall = 0;
    for (const row of receipts) {
      overall += row.total;
      const key = keyOf(row);
      const bucket = buckets.get(key) ?? { total: 0, receipts: 0 };
      bucket.total += row.total;
      bucket.receipts += 1;
      buckets.set(key, bucket);
    }

    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      groups: Array.from(buckets, ([group, bucket]) => ({
        group,
        total: round(bucket.total),
        receipts: bucket.receipts,
      })).sort((a, b) => b.total - a.total),
      overall: { total: round(overall), receipts: receipts.length },
    };
  },
});
