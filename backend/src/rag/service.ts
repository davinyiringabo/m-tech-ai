import pgvector from "pgvector/pg";
import { config } from "../config.js";
import { query } from "../db/index.js";
import { chat, embed, embedOne } from "../llm/ollama.js";
import { chunkText } from "./chunk.js";

const NOT_FOUND_MESSAGE = "I couldn't find this in the knowledge base.";

const SYSTEM_PROMPT = `You are a grounded knowledge assistant.
Answer the user's question using ONLY the numbered context passages provided.
- Cite the passages you use with bracketed numbers like [1], [2].
- If the context does not contain the answer, reply with EXACTLY:
  "${NOT_FOUND_MESSAGE}"
Do not use any outside knowledge. Do not guess.`;

export async function ingestDocument(input: {
  title: string;
  source?: string;
  content: string;
}): Promise<{ documentId: string; chunks: number }> {
  const chunks = chunkText(input.content);
  if (chunks.length === 0) {
    throw new Error("Document has no usable content");
  }

  const docRes = await query<{ id: string }>(
    `INSERT INTO documents (title, source) VALUES ($1, $2) RETURNING id`,
    [input.title, input.source ?? null],
  );
  const documentId = docRes.rows[0].id;

  const embeddings = await embed(chunks);
  for (let i = 0; i < chunks.length; i++) {
    await query(
      `INSERT INTO chunks (document_id, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4)`,
      [documentId, i, chunks[i], pgvector.toSql(embeddings[i])],
    );
  }

  return { documentId, chunks: chunks.length };
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

type RetrievedRow = {
  id: string;
  content: string;
  chunk_index: number;
  document_id: string;
  document_title: string;
  similarity: number;
};

async function retrieve(question: string): Promise<RetrievedRow[]> {
  const vec = await embedOne(question);
  const res = await query<RetrievedRow>(
    `SELECT c.id,
            c.content,
            c.chunk_index,
            c.document_id,
            d.title AS document_title,
            1 - (c.embedding <=> $1) AS similarity
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     ORDER BY c.embedding <=> $1
     LIMIT $2`,
    [pgvector.toSql(vec), config.rag.topK],
  );
  return res.rows;
}

export async function answerQuestion(question: string): Promise<RagAnswer> {
  const rows = await retrieve(question);
  const topSimilarity = rows[0]?.similarity ?? 0;

  // Gate 1: if nothing is similar enough, short-circuit. This is our concrete
  // definition of "not in the knowledge base" (UC2 under-specified point).
  if (rows.length === 0 || topSimilarity < config.rag.minSimilarity) {
    return {
      answer: NOT_FOUND_MESSAGE,
      grounded: false,
      citations: [],
      topSimilarity,
    };
  }

  const context = rows
    .map((r, i) => `[${i + 1}] (from "${r.document_title}")\n${r.content}`)
    .join("\n\n");

  const answer = await chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
  ]);

  // Gate 2: the model itself may decide the context is insufficient.
  const grounded = !answer
    .trim()
    .toLowerCase()
    .startsWith(NOT_FOUND_MESSAGE.toLowerCase());

  const citations: Citation[] = grounded
    ? rows.map((r, i) => ({
        index: i + 1,
        documentId: r.document_id,
        documentTitle: r.document_title,
        chunkIndex: r.chunk_index,
        similarity: Number(r.similarity.toFixed(3)),
        snippet: r.content.slice(0, 240),
      }))
    : [];

  return { answer: answer.trim(), grounded, citations, topSimilarity };
}

export async function listDocuments(): Promise<
  {
    id: string;
    title: string;
    source: string | null;
    chunks: number;
    created_at: string;
  }[]
> {
  const res = await query<{
    id: string;
    title: string;
    source: string | null;
    chunks: string;
    created_at: string;
  }>(
    `SELECT d.id, d.title, d.source, COUNT(c.id) AS chunks, d.created_at
     FROM documents d
     LEFT JOIN chunks c ON c.document_id = d.id
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
  );
  return res.rows.map((r: any) => ({ ...r, chunks: Number(r.chunks) }));
}
