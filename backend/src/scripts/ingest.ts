import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db/index.js";
import { ingestDocument } from "../rag/service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_DIR = join(__dirname, "..", "..", "data", "kb");

function titleFromFilename(file: string): string {
  return file
    .replace(extname(file), "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function ingest() {
  const files = (await readdir(KB_DIR)).filter((f) => /\.(md|txt)$/i.test(f));
  if (files.length === 0) {
    console.log(`No .md/.txt files found in ${KB_DIR}`);
    await pool.end();
    return;
  }
  console.log(`Ingesting ${files.length} document(s) from ${KB_DIR} (embedding, please wait)...`);
  for (const file of files) {
    const content = await readFile(join(KB_DIR, file), "utf8");
    const result = await ingestDocument({
      title: titleFromFilename(file),
      source: file,
      content,
    });
    console.log(`  ${file} -> ${result.chunks} chunks`);
  }
  console.log("Ingestion complete.");
  await pool.end();
}

ingest().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
