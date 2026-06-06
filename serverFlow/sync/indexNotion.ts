import { Client } from "@notionhq/client";
import { Pool } from "pg";
import { embedBatch } from "../rag/embed.ts";
import { chunkText } from "../lib/chunker.ts";
import dotenv from "dotenv";

dotenv.config();
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Extract plain text from Notion block types
function extractTextFromBlocks(blocks: any[]): string {
  return blocks
    .map((block) => {
      const type = block.type;
      const richText = block[type]?.rich_text ?? [];
      const text = richText.map((t: any) => t.plain_text).join("");

      if (type === "bulleted_list_item") return `• ${text}`;
      if (type === "numbered_list_item") return `${text}`;
      if (type === "heading_1") return `\n# ${text}\n`;
      if (type === "heading_2") return `\n## ${text}\n`;
      if (type === "heading_3") return `\n### ${text}\n`;
      return text;
    })
    .filter(Boolean)
    .join("\n");
}

export async function indexWorkspace(workspaceId: string): Promise<void> {
  console.log(`Starting Notion sync for workspace: ${workspaceId}`);

  // Wipe old chunks for this workspace — full re-index
  await pool.query(
    `DELETE FROM document_chunks WHERE workspace_id = $1`,
    [workspaceId]
);

  // Fetch all pages shared with your integration
  const { results: pages } = await notion.search({
    filter: { property: "object", value: "page" },
  });

  let totalChunks = 0;

  for (const page of pages) {
    if (page.object !== "page") continue;

    // Get page title
    const titleProp = (page as any).properties?.title?.title;
    const title = titleProp?.[0]?.plain_text ?? "Untitled";

    // Get all blocks (the actual content)
    const { results: blocks } = await notion.blocks.children.list({
      block_id: page.id,
    });

    const pageText = extractTextFromBlocks(blocks);
    if (!pageText.trim()) continue;  // skip empty pages

    // Split into chunks
    const chunks = chunkText(pageText);
    if (chunks.length === 0) continue;

    // Embed all chunks for this page in parallel
    const embeddings = await embedBatch(chunks);

    // Store each chunk with its embedding
    for (let i = 0; i < chunks.length; i++) {
      const vectorStr = JSON.stringify(embeddings[i]);
      await pool.query(
        `
        INSERT INTO document_chunks
          (workspace_id, content, source_url, source_title, embedding)
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::vector
        )
      `, [
        workspaceId,
        chunks[i],
        "https://notion.so/" + page.id.replace(/-/g, ""),
        title,
        vectorStr
      ]);
      totalChunks++;
    }

    console.log(`Indexed "${title}" — ${chunks.length} chunks`);
  }

  console.log(`Sync complete. Total chunks stored: ${totalChunks}`);
}