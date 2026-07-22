export const RECEIPT_CATEGORIES = [
  "groceries",
  "dining",
  "transport",
  "shopping",
  "health",
  "entertainment",
  "utilities",
  "travel",
  "subscriptions",
  "other",
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];

/** Open-ended date bounds for the Convex by_purchasedAt range index. */
export const DATE_MIN = "0000-01-01";
export const DATE_MAX = "9999-12-31";

export interface ReceiptRow {
  id: string;
  merchant: string;
  total: number;
  currency: string;
  category: string;
  purchasedAt: string;
  items: string | null;
  notes: string | null;
}
