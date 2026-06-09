import { Ollama } from "ollama";
import { z } from "zod";
import { config } from "../config.js";

const ollama = new Ollama({ host: config.ollama.host }); // Pull Ollama from the config

type Message = { role: "system" | "user" | "assistant"; content: string };

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  // This is a helper function to timeout the promise
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

// This is the main function to chat with the model, Plain text chat completion. Used for the RAG answer step
export async function chat(
  messages: Message[],
  opts: { model?: string; temperature?: number; timeoutMs?: number } = {},
): Promise<string> {
  const res = await withTimeout(
    ollama.chat({
      model: opts.model ?? config.ollama.chatModel,
      messages,
      options: { temperature: opts.temperature ?? 0.2 },
    }),
    opts.timeoutMs ?? 120_000,
    "ollama.chat",
  );
  return res.message.content;
}

export type StructuredResult<T> =
  | { ok: true; data: T; raw: string; attempts: number }
  | { ok: false; error: string; raw: string; attempts: number };

/**
 * This is a structured generation constrained by a Zod schema.
 *
 * Defence-in-depth against malformed model output:
 *  1. We pass the JSON Schema to Ollama's `format` field so generation is
 *     constrained to that shape at the source (grammar-constrained decoding).
 *  2. We parse + validate the response with Zod.
 *  3. On failure we retry once, then surface a structured error so the caller
 *     can fall back gracefully instead of throwing.
 */
export async function generateStructured<T extends z.ZodTypeAny>( // This is the main function to generate structured data with the model
  schema: T,
  messages: Message[],
  opts: {
    model?: string;
    temperature?: number;
    timeoutMs?: number;
    retries?: number;
  } = {},
): Promise<StructuredResult<z.infer<T>>> {
  const jsonSchema = z.toJSONSchema(schema);
  const maxAttempts = (opts.retries ?? 1) + 1;
  let lastRaw = "";
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await withTimeout(
        ollama.chat({
          model: opts.model ?? config.ollama.chatModel,
          messages,
          format: jsonSchema as Record<string, unknown>,
          options: { temperature: opts.temperature ?? 0 },
        }),
        opts.timeoutMs ?? 120_000,
        "ollama.generateStructured",
      );
      lastRaw = res.message.content;

      const parsedMessage = safeJsonParse(lastRaw);
      if (!parsedMessage.ok) {
        lastError = parsedMessage.error;
        continue;
      }
      const validatedMessage = schema.safeParse(parsedMessage.value);
      if (!validatedMessage.success) {
        lastError = validatedMessage.error.message;
        continue;
      }
      return {
        ok: true,
        data: validatedMessage.data,
        raw: lastRaw,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { ok: false, error: lastError, raw: lastRaw, attempts: maxAttempts };
}

// This is the main function to embed the input with the model
export async function embed(
  input: string[],
  opts: { model?: string; timeoutMs?: number } = {},
): Promise<number[][]> {
  if (input.length === 0) return [];
  const res = await withTimeout(
    ollama.embed({ model: opts.model ?? config.ollama.embedModel, input }),
    opts.timeoutMs ?? 120_000,
    "ollama.embed",
  );
  return res.embeddings;
}

export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embed([text]);
  return vec;
}

/**
 * Tolerant JSON parse: handles the common small-model habit of wrapping JSON
 * in prose or markdown code fences even when constrained output mostly works.
 */
function safeJsonParse(
  raw: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = raw.trim();
  const candidates = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first)
    candidates.push(trimmed.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      // try next candidate
    }
  }
  return { ok: false, error: "Response was not valid JSON" };
}

export async function isOllamaReachable(): Promise<boolean> {
  try {
    await withTimeout(ollama.list(), 5_000, "ollama.list");
    return true;
  } catch {
    return false;
  }
}
