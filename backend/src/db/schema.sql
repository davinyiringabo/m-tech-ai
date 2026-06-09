-- pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Use Case 1: Smart Intake Triage
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text        TEXT NOT NULL,
  category        TEXT NOT NULL,
  priority        TEXT NOT NULL,
  sentiment       TEXT NOT NULL,
  summary         TEXT NOT NULL,
  customer_name   TEXT,
  product         TEXT,
  order_id        TEXT,
  suggested_reply TEXT NOT NULL,
  confidence      REAL NOT NULL DEFAULT 0,
  -- 'ok' when the model returned valid structured output,
  -- 'fallback' when we had to recover from malformed output.
  status          TEXT NOT NULL DEFAULT 'ok',
  model           TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets (category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);

-- ============================================================
-- Use Case 2: Grounded Knowledge Assistant (RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- nomic-embed-text produces 768-dimensional embeddings.
CREATE TABLE IF NOT EXISTS chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(768) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approximate nearest-neighbour index using cosine distance.
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks (document_id);
