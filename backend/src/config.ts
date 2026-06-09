import dotenv from "dotenv";

// Load .env.local first (developer overrides), then .env as a fallback.
// dotenv does not overwrite already-set vars, so .env.local wins.
dotenv.config({ path: ".env.local" });
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3001",
  databaseUrl: required(
    "DATABASE_URL",
    "postgres://minetech:minetech@localhost:5432/minetech",
  ),
  ollama: {
    host: process.env.OLLAMA_HOST ?? "http://localhost:11434",
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? "llama3.2",
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
  },
  rag: {
    topK: Number(process.env.RAG_TOP_K ?? 4),
    minSimilarity: Number(process.env.RAG_MIN_SIMILARITY ?? 0.35),
  },
} as const;
