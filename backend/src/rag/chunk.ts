/**
 * This is a lightweight recursive chunker.
 *
 * It should split on paragraph boundaries first, Splits on paragraph boundaries first, packs them up to ~`maxChars`, and adds a
 * small overlap so context isn't lost at chunk edges. This is Kept dependency-free
 */
export function chunkText(
  text: string,
  {
    maxChars = 900,
    overlap = 150,
  }: { maxChars?: number; overlap?: number } = {},
): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      flush();
      // Hard-split very long paragraphs by sentence, then by length.
      const sentences = para.match(/[^.!?]+[.!?]*\s*/g) ?? [para];
      let buf = "";
      for (const s of sentences) {
        if ((buf + s).length > maxChars) {
          if (buf.trim()) chunks.push(buf.trim());
          buf = s;
        } else {
          buf += s;
        }
      }
      if (buf.trim()) chunks.push(buf.trim());
      continue;
    }

    if ((current + "\n\n" + para).length > maxChars) {
      flush();
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  flush();

  // Add overlap from the tail of the previous chunk for continuity.
  if (overlap > 0 && chunks.length > 1) {
    return chunks.map((chunk, i) => {
      if (i === 0) return chunk;
      const prevTail = chunks[i - 1].slice(-overlap);
      return `${prevTail} ${chunk}`.trim();
    });
  }
  return chunks;
}
