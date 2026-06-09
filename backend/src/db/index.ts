import pg from "pg";
import pgvector from "pgvector/pg";
import { config } from "../config.js";

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

let registered = false;

// pgvector needs its type parser registered on a live connection so that
// `vector` columns round-trip as JS number[] instead of strings.
// We register it lazily and tolerate failure: Use Case 1 (triage) doesn't touch
// vectors, so a missing extension (e.g. before `npm run migrate`) shouldn't break it.
export async function getClient(): Promise<pg.PoolClient> {
  const client = await pool.connect();
  if (!registered) {
    registered = true;
    try {
      await pgvector.registerType(client);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[db] Could not register pgvector type (RAG features need it). ` +
          `Run 'npm run migrate' against a pgvector-enabled Postgres. Details: ${message}`
      );
    }
  }
  return client;
}

// This is the main function to query the database
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const client = await getClient();
  try {
    return await client.query<T>(text, params as never);
  } finally {
    client.release();
  }
}
