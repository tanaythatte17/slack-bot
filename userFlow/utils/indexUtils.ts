import crypto from "crypto";

export async function getAllBlocks(notion: any, blockId: string) {
  let results: any[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const res: any = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });

    results.push(...res.results);

    if (!res.has_more) break;

    cursor = res.next_cursor ?? undefined;
  }

  return results;
}


export function extractTextFromBlocks(blocks: any[]): string {
  return blocks
    .map((block) => {
      const type = block.type;
      const richText = block[type]?.rich_text ?? [];
      const text = richText.map((t: any) => t.plain_text).join("");

      if (type === "heading_1") return `\n# ${text}\n`;
      if (type === "heading_2") return `\n## ${text}\n`;
      if (type === "heading_3") return `\n### ${text}\n`;

      return text;
    })
    .filter(Boolean)
    .join("\n");
}

export function chunkText(
  text: string,
  chunkSize = 180,
  overlap = 30
): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  let currentChunk: string[] = [];
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).length;

    // If adding paragraph exceeds chunk size,
    // finalize current chunk
    if (
      currentWords + paragraphWords > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.join("\n"));

      // overlap handling
      const overlapText = currentChunk
        .join("\n")
        .split(/\s+/)
        .slice(-overlap)
        .join(" ");

      currentChunk = [overlapText];
      currentWords = overlap;
    }

    currentChunk.push(paragraph);
    currentWords += paragraphWords;
  }

  // Push final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n"));
  }

  return chunks.filter(chunk => chunk.trim().length > 50);
}

export function generateHash(content: string) {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex");
}