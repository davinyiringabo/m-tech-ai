# Minetech AI — Self-hosted LLM Assistant

Two AI features built on top of a **single self-hosted open-source model** (no hosted/commercial APIs):

1. **Smart Intake Triage** — paste an inbound support message; the model classifies it (category + priority), extracts key fields, and drafts a reply, returned as **validated structured JSON** and shown in a filterable dashboard.
2. **Grounded Knowledge Assistant (RAG)** — ask questions against a small document knowledge base; answers are **grounded in retrieved context with citations**, and the assistant says when something isn't in the knowledge base instead of guessing.

The model runs locally via **Ollama** (`llama3.2`, a 3B model) with **`nomic-embed-text`** for embeddings. Storage and vector search use **Postgres + pgvector**.

> Built and tested on an Apple M1 MacBook Air (8 GB RAM). The model choice is deliberately sized for that hardware — see [`DECISION_MEMO.md`](./DECISION_MEMO.md).

---

## Architecture

```
┌──────────────────┐      HTTP/JSON      ┌──────────────────┐
│  Frontend         │ ─────────────────▶ │  Backend          │
│  Next.js + React  │                    │  Express + TS     │
│  (port 3000)      │ ◀───────────────── │  (port 4000)      │
└──────────────────┘                     └────────┬─────────┘
                                                   │
                              ┌────────────────────┼─────────────────────┐
                              ▼                                            ▼
                   ┌────────────────────┐                     ┌────────────────────┐
                   │ Ollama (host)       │                     │ Postgres + pgvector │
                   │ llama3.2            │                     │ tickets, documents, │
                   │ nomic-embed-text    │                     │ chunks (vector 768) │
                   └────────────────────┘                     └────────────────────┘
```

- **Frontend** (`/frontend`): Next.js (App Router) + Tailwind, shadcn-style components. Pure UI that calls the backend.
- **Backend** (`/backend`): standalone Express + TypeScript REST API. Owns all model and database access.
- **Ollama** runs on the host so it can use the Mac's GPU (Metal). Containers reach it via `host.docker.internal`.

---

## Prerequisites

- **[Ollama](https://ollama.com/download)** installed and running on your machine.
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (for the easy path) **or** Node.js 20+ and a local Postgres with pgvector (for the manual path).

Pull the two models once:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

Verify Ollama is serving:

```bash
curl http://localhost:11434/api/tags
```

---

## Run it — Option A: Docker (recommended)

This runs the **database, backend, and frontend** in containers. Ollama stays on the host.

```bash
# 1. (optional) create a local env file; defaults work out of the box
cp .env.example .env

# 2. build and start everything
docker compose up --build
```

The backend applies database migrations automatically on startup. Once it's up:

```bash
# 3. load the sample knowledge base (3 markdown docs) for the RAG feature
docker compose exec backend npx tsx src/scripts/ingest.ts

# 4. (optional) seed a handful of example tickets for the triage dashboard
docker compose exec backend npx tsx src/scripts/seed.ts
```

Open **http://localhost:3000**.

To stop: `docker compose down` (add `-v` to also wipe the database volume).

---

## Run it — Option B: Manual (local dev)

Use this if you want hot-reload or don't want to containerize the apps.

**1. Start Postgres with pgvector** (easiest via Docker, or use your own Postgres that has the `vector` extension):

```bash
docker compose up -d db
```

**2. Backend**

```bash
cd backend
cp .env.example .env          # defaults point at localhost:5432
npm install
npm run migrate               # creates the vector extension + tables
npm run ingest                # loads the sample knowledge base
npm run seed                  # optional: example tickets
npm run dev                   # http://localhost:4000
```

**3. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

The frontend reads the backend URL from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`).

---

## Using the app

- **Intake Triage** (`/`): paste a support message (or click an example) and hit **Triage**. The result is classified, key fields are extracted, a reply is drafted, and it lands in the dashboard. Filter by category/priority, search, and click a row to see the full breakdown and copy the suggested reply.
- **Knowledge Assistant** (`/chat`): ask a question. Grounded answers show a **Sources** panel with citations and match scores. Questions outside the knowledge base get an honest "I couldn't find this in the knowledge base." You can **upload `.txt`/`.md` files** or paste text to add documents on the fly.

---

## Configuration

All settings have sane defaults. Backend reads from `backend/.env` / `.env.local`; Docker reads from the root `.env` (see `.env.example`).

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_CHAT_MODEL` | `llama3.2` | Generation model (swap to e.g. `qwen2.5:3b`) |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Embedding model (768 dims) |
| `RAG_TOP_K` | `4` | Chunks retrieved per question |
| `RAG_MIN_SIMILARITY` | `0.35` | Below this top-match score ⇒ "not in knowledge base" |
| `DATABASE_URL` | `postgres://minetech:minetech@localhost:5432/minetech` | Postgres connection |

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Backend + Ollama status, active models |
| `POST` | `/api/triage` | `{ text }` → triaged ticket (structured JSON) |
| `GET` | `/api/tickets` | `?category=&priority=&search=` filterable list |
| `GET` | `/api/tickets/stats` | Dashboard counts |
| `GET` | `/api/triage/meta` | Category/priority enums |
| `POST` | `/api/documents` | `{ title, content, source? }` → ingest a document |
| `GET` | `/api/documents` | List knowledge-base documents |
| `POST` | `/api/ask` | `{ question }` → grounded answer + citations |

---

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── server.ts            # Express app + routes
│   │   ├── config.ts            # env config
│   │   ├── db/                  # pg pool, schema.sql, migrate
│   │   ├── llm/ollama.ts        # typed Ollama client (structured output, embeddings)
│   │   ├── triage/             # UC1: schema, service, routes
│   │   ├── rag/                # UC2: chunking, service, routes
│   │   ├── scripts/            # seed.ts, ingest.ts
│   │   └── data/knowledge-base/ # sample KB (markdown)
│   └── Dockerfile
├── frontend/
│   ├── src/app/                 # / (triage), /chat (assistant)
│   ├── src/components/          # layout, triage, chat, ui
│   └── Dockerfile
├── docker-compose.yml
```

---

## Troubleshooting

- **`extension "vector" is not available`** — your Postgres doesn't have pgvector. Use the provided Docker DB (`docker compose up -d db`), which is the `pgvector/pgvector` image.
- **Backend can't reach Ollama from Docker** — make sure Ollama is running on the host; the container uses `host.docker.internal:11434`.
- **RAG always says "not in the knowledge base"** — run the ingest step, and confirm `nomic-embed-text` is pulled.
- **First responses are slow** — the model loads into memory on first call; subsequent calls are faster. On 8 GB RAM, keep other heavy apps closed.
