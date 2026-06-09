import { z } from "zod";

/**
 * Triage schema (UC1 deliberate under-specified point).
 *
 * Design choices, documented for the decision memo:
 *  - `category` / `priority` / `sentiment` are CLOSED enums so the dashboard can
 *    filter reliably and the model can't invent labels.
 *  - `extracted` fields are nullable: not every ticket contains a name/product/order.
 *    Forcing them would invite hallucination.
 *  - `confidence` lets the UI flag low-confidence items for human review instead of
 *    silently trusting the model.
 */
export const CATEGORIES = [
  "billing",
  "technical",
  "account",
  "feature_request",
  "complaint",
  "other",
] as const;

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const SENTIMENTS = ["positive", "neutral", "negative"] as const;

export const triageSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  sentiment: z.enum(SENTIMENTS),
  summary: z.string().min(1).max(280),
  extracted: z.object({
    customer_name: z.string().nullable(),
    product: z.string().nullable(),
    order_id: z.string().nullable(),
  }),
  suggested_reply: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type Triage = z.infer<typeof triageSchema>;
