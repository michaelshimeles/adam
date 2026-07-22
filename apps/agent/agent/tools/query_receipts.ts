import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient } from "../lib/convex";
import {
  DATE_MAX,
  DATE_MIN,
  RECEIPT_CATEGORIES,
  type ReceiptRow,
} from "../lib/receipts";

export default defineTool({
  description:
    "List logged receipts with optional filters, newest first, including the filtered total. Use for questions like 'what did I spend at Loblaws' or 'show my dining expenses this month'.",
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
    category: z.enum(RECEIPT_CATEGORIES).optional(),
    merchant: z
      .string()
      .max(200)
      .optional()
      .describe("Case-insensitive substring match"),
    limit: z.number().int().min(1).max(200).default(50),
  }),
  async execute({ from, to, category, merchant, limit }) {
    const receipts = (await convexClient().query(backend.receiptsListRange, {
      from: from ?? DATE_MIN,
      to: to ?? DATE_MAX,
      ...(category !== undefined ? { category } : {}),
      ...(merchant !== undefined ? { merchant } : {}),
      limit,
    })) as ReceiptRow[];
    const total = receipts.reduce((sum, row) => sum + row.total, 0);
    return {
      receipts,
      matched: receipts.length,
      total: Math.round(total * 100) / 100,
    };
  },
});
