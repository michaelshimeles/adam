import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient, serviceSecret } from "../lib/convex";
import { RECEIPT_CATEGORIES } from "../lib/receipts";

export default defineTool({
  description:
    "Log a purchase receipt to the expense database. Use when the user sends a receipt photo (extract the fields from the image) or describes a purchase to log. Amounts are in dollars.",
  inputSchema: z.object({
    merchant: z
      .string()
      .min(1)
      .max(200)
      .describe("Store or vendor name as printed"),
    total: z.number().positive().describe("Grand total in dollars, e.g. 84.20"),
    currency: z
      .string()
      .length(3)
      .toUpperCase()
      .default("USD")
      .describe("ISO currency code from the receipt"),
    category: z.enum(RECEIPT_CATEGORIES).describe("Best-fit spending category"),
    purchased_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Purchase date YYYY-MM-DD; use today if the receipt shows none"),
    items: z
      .array(
        z.object({
          name: z.string().min(1).max(200),
          price: z.number().optional().describe("Line price in dollars"),
          quantity: z.number().optional(),
        }),
      )
      .max(100)
      .optional()
      .describe("Line items when legible"),
    notes: z
      .string()
      .max(1000)
      .optional()
      .describe("Anything worth remembering about this purchase"),
  }),
  async execute(input) {
    return await convexClient().mutation(backend.receiptsLog, {
      secret: serviceSecret(),
      merchant: input.merchant,
      totalCents: Math.round(input.total * 100),
      currency: input.currency,
      category: input.category,
      purchasedAt: input.purchased_at,
      ...(input.items !== undefined
        ? { itemsJson: JSON.stringify(input.items) }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
  },
});
