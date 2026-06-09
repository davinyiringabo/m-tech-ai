import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = await readFile(join(__dirname, "schema.sql"), "utf8");
  console.log("Running migrations...");
  await pool.query(sql);
  console.log("Migrations applied.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
