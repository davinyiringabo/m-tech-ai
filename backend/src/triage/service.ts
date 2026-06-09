import { config } from "../config.js";
import { query } from "../db/index.js";
import { generateStructured } from "../llm/ollama.js";
import {
  CATEGORIES,
  PRIORITIES,
  SENTIMENTS,
  triageSchema,
  type Triage,
} from "./schema.js";

const SYSTEM_PROMPT = `You are an expert customer-support triage assistant.
Given a single inbound message, you classify it and draft a reply.

Rules:
- category must be one of: ${CATEGORIES.join(", ")}.
- priority must be one of: ${PRIORITIES.join(", ")}. Use "urgent" only for outages,
  security/billing emergencies, or churn risk.
- sentiment must be one of: ${SENTIMENTS.join(", ")}.
- summary: one concise sentence describing the issue.
- extracted: pull customer_name, product, order_id if present, otherwise null. Do not invent values.
- suggested_reply: a polite, helpful, ready-to-send draft (2-5 sentences).
- confidence: your confidence in the classification from 0 to 1.
Respond with JSON only.`;

export type TriageRecord = {
  id: string;
  raw_text: string;
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  customer_name: string | null;
  product: string | null;
  order_id: string | null;
  suggested_reply: string;
  confidence: number;
  status: "ok" | "fallback";
  model: string;
  created_at: string;
};

// Safe default used when the model fails to produce valid output even after retry.
function fallbackTriage(): Triage {
  return {
    category: "other",
    priority: "medium",
    sentiment: "neutral",
    summary: "Could not be automatically triaged — needs human review.",
    extracted: { customer_name: null, product: null, order_id: null },
    suggested_reply:
      "Thanks for reaching out. We've received your message and a team member will follow up shortly.",
    confidence: 0,
  };
}

export async function triageText(rawText: string): Promise<TriageRecord> {
  const result = await generateStructured(triageSchema, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: rawText },
  ]);

  const triage: Triage = result.ok ? result.data : fallbackTriage();
  const status: "ok" | "fallback" = result.ok ? "ok" : "fallback";

  const inserted = await query<TriageRecord>(
    `INSERT INTO tickets
       (raw_text, category, priority, sentiment, summary,
        customer_name, product, order_id, suggested_reply, confidence, status, model)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      rawText,
      triage.category,
      triage.priority,
      triage.sentiment,
      triage.summary,
      triage.extracted.customer_name,
      triage.extracted.product,
      triage.extracted.order_id,
      triage.suggested_reply,
      triage.confidence,
      status,
      config.ollama.chatModel,
    ],
  );

  return inserted.rows[0];
}

export type TicketFilters = {
  category?: string;
  priority?: string;
  search?: string;
};

export async function listTickets(
  filters: TicketFilters,
): Promise<TriageRecord[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.category) {
    params.push(filters.category);
    where.push(`category = $${params.length}`);
  }
  if (filters.priority) {
    params.push(filters.priority);
    where.push(`priority = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(
      `(raw_text ILIKE $${params.length} OR summary ILIKE $${params.length})`,
    );
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const res = await query<TriageRecord>(
    `SELECT * FROM tickets ${clause} ORDER BY created_at DESC LIMIT 200`,
    params,
  );
  return res.rows;
}

export async function getTicketStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  needsReview: number;
}> {
  const res = await query<{
    category: string;
    priority: string;
    status: string;
  }>(`SELECT category, priority, status FROM tickets`);
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let needsReview = 0;
  for (const row of res.rows) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
    byPriority[row.priority] = (byPriority[row.priority] ?? 0) + 1;
    if (row.status === "fallback") needsReview++;
  }
  return { total: res.rows.length, byCategory, byPriority, needsReview };
}
