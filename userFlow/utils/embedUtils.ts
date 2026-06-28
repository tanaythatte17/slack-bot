import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import {prisma} from "../lib/prisma"
import type { ChunkToEmbed } from "./notionIndexUtils";

dotenv.config();

// ---------------------------------------------------
// Gemini Embedding Setup
// ---------------------------------------------------

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

// ---------------------------------------------------
// Single Embedding
// ---------------------------------------------------

export async function embedText(
  text: string,
  taskType:
    | "RETRIEVAL_DOCUMENT"
    | "RETRIEVAL_QUERY" = "RETRIEVAL_QUERY"
): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: {
      role: "user",
      parts: [{ text }],
    },
    taskType,
  });

  return result.embedding.values;
}

// ---------------------------------------------------
// Batch Embedding
// ---------------------------------------------------

export async function embedChunks(
  chunks: ChunkToEmbed[]
): Promise<number[][]> {
  const texts = chunks.map((chunk) => chunk.content);

  const results: number[][] = [];
  const batchSize = 5;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((text) =>
        embedText(text, "RETRIEVAL_DOCUMENT")
      )
    );

    results.push(...batchResults);
  }

  return results;
}

// ---------------------------------------------------
// Store Embedded Chunks
// ---------------------------------------------------

export async function storeChunks(
  workspaceId: string,
  chunks: ChunkToEmbed[],
  embeddings: number[][]
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    const embeddingLiteral = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (
        id,
        workspace_id,
        source_notion_id,
        source_url,
        source_title,
        notion_block_id,
        heading_path,
        content_hash,
        content,
        chunk_index,
        embedding,
        created_at
      ) VALUES (
        gen_random_uuid(),
        ${workspaceId},
        ${chunk.pageId},
        ${"https://notion.so/" +
          chunk.pageId.replace(/-/g, "")},
        ${chunk.pageTitle},
        ${chunk.chunkId},
        ${JSON.stringify(chunk.headingPath)}::jsonb,
        ${chunk.hash},
        ${chunk.content},
        ${chunk.splitIndex},
        ${embeddingLiteral}::vector,
        NOW()
      )
      ON CONFLICT (notion_block_id)
      DO UPDATE SET
        content = EXCLUDED.content,
        content_hash = EXCLUDED.content_hash,
        heading_path = EXCLUDED.heading_path,
        embedding = EXCLUDED.embedding
    `;
  }
}