export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type TicketStatus = "ok" | "fallback";

export type Ticket = {
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
  status: TicketStatus;
  model: string;
  created_at: string;
};

export type TicketStats = {
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  needsReview: number;
};

export type TriageMeta = {
  categories: string[];
  priorities: string[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export type Citation = {
  index: number;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  similarity: number;
  snippet: string;
};

export type RagAnswer = {
  answer: string;
  grounded: boolean;
  citations: Citation[];
  topSimilarity: number;
};

export type KbDocument = {
  id: string;
  title: string;
  source: string | null;
  chunks: number;
  created_at: string;
};

export const api = {
  triage: (text: string) =>
    request<Ticket>("/triage", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  listTickets: (filters: {
    category?: string;
    priority?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.search) params.set("search", filters.search);
    const qs = params.toString();
    return request<{ tickets: Ticket[] }>(`/tickets${qs ? `?${qs}` : ""}`);
  },

  stats: () => request<TicketStats>("/tickets/stats"),

  meta: () => request<TriageMeta>("/triage/meta"),

  ask: (question: string) =>
    request<RagAnswer>("/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  listDocuments: () => request<{ documents: KbDocument[] }>("/documents"),

  addDocument: (doc: { title: string; source?: string; content: string }) =>
    request<{ documentId: string; chunks: number }>("/documents", {
      method: "POST",
      body: JSON.stringify(doc),
    }),

  health: () =>
    request<{
      status: string;
      ollama: string;
      chatModel: string;
      embedModel: string;
    }>("/health"),
};
