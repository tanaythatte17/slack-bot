// rag/search.ts

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface Chunk {
  id: string;
  content: string;
  source_url: string;
  source_title: string;
  source_notion_id: string;
  chunk_index: number;
  similarity: number;
}

const MIN_SIMILIARITY_FLOOR = 0.58;
const INITIAL_RETRIEVAL_COUNT = 30;
const MAX_CHUNKS_PER_PAGE = 2;
const FINAL_CHUNK_LIMIT = 8;

export async function searchChunks(
  queryEmbedding: number[],
  workspaceId: string
): Promise<Chunk[]> {
  const client = await pool.connect();

  try {
    const vectorStr = JSON.stringify(queryEmbedding);

    // STEP 1 — initial retrieval
    const res = await client.query(
      `
      SELECT
        id,
        content,
        source_url,
        source_title,
        source_notion_id,
        chunk_index,
        1 - (embedding <=> $1::vector) AS similarity
      FROM "DocumentChunk"
      WHERE workspace_id = $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
      `,
      [vectorStr, workspaceId, INITIAL_RETRIEVAL_COUNT]
    );

    const retrieved: Chunk[] = res.rows;
    console.log('Retrieved chunks are');
    console.log(
      retrieved.map((r) => ({
        title: r.source_title,
        similarity: r.similarity,
        preview: r.content.slice(0, 80),
      }))
    );

    const bestScore = retrieved[0]?.similarity ?? 0;

    // reject garbage queries entirely
    if (bestScore < MIN_SIMILIARITY_FLOOR) {
      return [];
    }

    // dynamic threshold
    const threshold = Math.max(
      bestScore - 0.10,
      0.62
    );

    const filtered = retrieved.filter(
      (chunk) => chunk.similarity >= threshold
    );

    if (filtered.length === 0) {
      return [];
    }

    // STEP 3 — deduplicate / diversify by page
    const pageCounts = new Map<string, number>();

    const diversified: Chunk[] = [];

    for (const chunk of filtered) {
      const count = pageCounts.get(chunk.source_notion_id) ?? 0;

      if (count >= MAX_CHUNKS_PER_PAGE) {
        continue;
      }

      diversified.push(chunk);

      pageCounts.set(chunk.source_notion_id, count + 1);
    }

    // STEP 4 — neighbor chunk expansion
    const expandedChunks: Chunk[] = [...diversified];

    for (const chunk of diversified) {
      const neighborRes = await client.query(
        `
        SELECT
          id,
          content,
          source_url,
          source_title,
          source_notion_id,
          chunk_index,
          1 AS similarity
        FROM "DocumentChunk"
        WHERE workspace_id = $1
          AND source_notion_id = $2
          AND chunk_index IN ($3, $4)
        `,
        [
          workspaceId,
          chunk.source_notion_id,
          chunk.chunk_index - 1,
          chunk.chunk_index + 1,
        ]
      );

      expandedChunks.push(...neighborRes.rows);
    }

    // STEP 5 — remove duplicates
    const uniqueMap = new Map<string, Chunk>();

    for (const chunk of expandedChunks) {
      uniqueMap.set(chunk.id, chunk);
    }

    const uniqueChunks = Array.from(uniqueMap.values());

    // STEP 6 — sort by similarity
    uniqueChunks.sort((a, b) => b.similarity - a.similarity);

    // STEP 7 — final limit
    return uniqueChunks.slice(0, FINAL_CHUNK_LIMIT);
  } finally {
    client.release();
  }
}