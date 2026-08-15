import { pool } from "../config/db.ts";

export interface Chunk {
  id: string;
  content: string;
  source_url: string;
  source_title: string;
  source_notion_id: string;
  chunk_index: number;
  similarity: number;
  retrieval_source?: "vector" | "bm25" | "neighbor";
}

const MIN_SIMILARITY_FLOOR = 0.58;
// ts_rank_cd isn't bounded like cosine similarity — this is a rough
// heuristic to drop near-zero keyword matches, not a calibrated threshold.
const MIN_BM25_SCORE = 0.01;
const RETRIEVAL_COUNT = 20;
const MAX_CHUNKS_PER_PAGE = 2;
const FINAL_CHUNK_LIMIT = 8;
const RRF_K = 60;
const COHERE_API_KEY = process.env.COHERE_API_KEY!;

// ─────────────────────────────────────────────
// Helper: Vector retrieval
// ─────────────────────────────────────────────
async function vectorSearch(
  client: any,
  queryEmbedding: number[],
  workspaceId: string
): Promise<Chunk[]> {
  const vectorStr = JSON.stringify(queryEmbedding);

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
    [vectorStr, workspaceId, RETRIEVAL_COUNT]
  );

  return res.rows.map((r: any) => ({
    ...r,
    similarity: parseFloat(r.similarity),   // ← fix: coerce string → number
    retrieval_source: "vector" as const,
  }));
}

// ─────────────────────────────────────────────
// Helper: BM25 retrieval via Postgres full-text search
// Prerequisite — run once in a migration:
//   CREATE INDEX IF NOT EXISTS document_chunk_fts_idx
//   ON "DocumentChunk" USING GIN (to_tsvector('english', content));
// ─────────────────────────────────────────────
async function bm25Search(
  client: any,
  query: string,
  workspaceId: string
): Promise<Chunk[]> {
  const res = await client.query(
    `
    SELECT
      id,
      content,
      source_url,
      source_title,
      source_notion_id,
      chunk_index,
      ts_rank_cd(
        to_tsvector('english', content),
        plainto_tsquery('english', $1),
        32
      ) AS similarity
    FROM "DocumentChunk"
    WHERE workspace_id = $2
      AND to_tsvector('english', content) @@ plainto_tsquery('english', $1)
    ORDER BY similarity DESC
    LIMIT $3
    `,
    [query, workspaceId, RETRIEVAL_COUNT]
  );


  return res.rows.map((r: any) => ({
    ...r,
    similarity: parseFloat(r.similarity),   // ← same fix
    retrieval_source: "bm25" as const,
  }));
}

// ─────────────────────────────────────────────
// Helper: Neighbor chunk expansion (±1 chunk per retrieved chunk)
// ─────────────────────────────────────────────
async function expandNeighbors(
  client: any,
  chunks: Chunk[],
  workspaceId: string,
  pageCounts: Map<string, number>
): Promise<Chunk[]> {
  const expanded: Chunk[] = [...chunks];

  for (const chunk of chunks) {
    if ((pageCounts.get(chunk.source_notion_id) ?? 0) >= MAX_CHUNKS_PER_PAGE) {
      continue;
    }

    const res = await client.query(
      `
      SELECT
        id,
        content,
        source_url,
        source_title,
        source_notion_id,
        chunk_index,
        0.0 AS similarity
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

    for (const r of res.rows as Chunk[]) {
      const count = pageCounts.get(chunk.source_notion_id) ?? 0;
      if (count >= MAX_CHUNKS_PER_PAGE) break;
      expanded.push({ ...r, retrieval_source: "neighbor" as const });
      pageCounts.set(chunk.source_notion_id, count + 1);
    }
  }

  return expanded;
}

// ─────────────────────────────────────────────
// Helper: Cross-encoder rerank via Cohere
// Swap the fetch URL/body for Jina or Mixedbread if preferred
// ─────────────────────────────────────────────
async function crossEncoderRerank(
  query: string,
  chunks: Chunk[]
): Promise<Chunk[]> {
  if (chunks.length === 0) return [];

  // Small enough already — no point paying for a rerank call
  if (chunks.length <= 3) {
    return chunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, FINAL_CHUNK_LIMIT);
  }

  try {
    const response = await fetch("https://api.cohere.com/v2/rerank", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "rerank-v3.5",
        query,
        documents: chunks.map((c) => c.content),
        top_n: FINAL_CHUNK_LIMIT,
        return_documents: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cohere rerank HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();

    const reranked = data.results.map(
      (result: { index: number; relevance_score: number }) => ({
        ...chunks[result.index],
        similarity: result.relevance_score,
      })
    );

    // Cohere scores: anything below 0.1 is the reranker saying "this isn't relevant"
    const MIN_RERANK_SCORE = 0.1;
    const filtered = reranked.filter((c: Chunk) => c.similarity >= MIN_RERANK_SCORE);

    console.log(
      "Post-rerank scores:",
      reranked.map((c: Chunk) => ({
        title: c.source_title,
        score: c.similarity.toFixed(4),
      }))
    );

    return filtered.length > 0 ? filtered : reranked.slice(0, 1);
  } catch (err) {
    console.error("Rerank failed, falling back:", err);
    return chunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, FINAL_CHUNK_LIMIT);
  }
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export async function searchChunks(
  queryEmbedding: number[],
  queryText: string,
  workspaceId: string
): Promise<Chunk[]> {
  const client = await pool.connect();

  try {
    // 1. Dual retrieval in parallel
    const [vectorChunks, bm25Chunks] = await Promise.all([
      vectorSearch(client, queryEmbedding, workspaceId),
      bm25Search(client, queryText, workspaceId),
    ]);

    // 2. Filter each list to its own relevance floor — a weak vector top
    // hit must not suppress a strong BM25 hit (e.g. exact ticket IDs,
    // function names, acronyms), and vice versa.
    const relevantVector = vectorChunks.filter(
      c => c.similarity >= MIN_SIMILARITY_FLOOR
    );
    const relevantBm25 = bm25Chunks.filter(
      c => c.similarity >= MIN_BM25_SCORE
    );

    if (relevantVector.length === 0 && relevantBm25.length === 0) {
      return [];
    }

    // 3. Reciprocal rank fusion — score chunks by rank position in each
    // list (1/(k + rank)), not by raw similarity, so the two differently
    // scaled retrieval methods combine fairly.
    const fusedScores = new Map<string, number>();
    const chunkById = new Map<string, Chunk>();

    relevantVector.forEach((chunk, i) => {
      fusedScores.set(chunk.id, (fusedScores.get(chunk.id) ?? 0) + 1 / (RRF_K + i + 1));
      chunkById.set(chunk.id, chunk);
    });
    relevantBm25.forEach((chunk, i) => {
      fusedScores.set(chunk.id, (fusedScores.get(chunk.id) ?? 0) + 1 / (RRF_K + i + 1));
      if (!chunkById.has(chunk.id)) chunkById.set(chunk.id, chunk);
    });

    const merged = Array.from(chunkById.values())
      .map(chunk => ({ ...chunk, similarity: fusedScores.get(chunk.id)! }))
      .sort((a, b) => b.similarity - a.similarity);

    // 4. Per-page diversification on the fused, ranked set
    const pageCounts = new Map<string, number>();
    const diversified: Chunk[] = [];
    for (const chunk of merged) {
      const count = pageCounts.get(chunk.source_notion_id) ?? 0;
      if (count >= MAX_CHUNKS_PER_PAGE) continue;
      diversified.push(chunk);
      pageCounts.set(chunk.source_notion_id, count + 1);
    }

    if (diversified.length === 0) return [];

    // 5. Neighbor expansion on the diversified set — shares pageCounts so
    // neighbors can't push any page past MAX_CHUNKS_PER_PAGE either
    const expanded = await expandNeighbors(client, diversified, workspaceId, pageCounts);

    // 6. Dedupe again — neighbors may overlap with already-retrieved chunks
    const uniqueMap = new Map<string, Chunk>();
    for (const chunk of expanded) {
      uniqueMap.set(chunk.id, chunk);
    }
    const candidates = Array.from(uniqueMap.values());

    console.log(`Candidates going into reranker: ${candidates.length}`);

    // 7. Cross-encoder rerank — returns final FINAL_CHUNK_LIMIT chunks
    return await crossEncoderRerank(queryText, candidates);
  } finally {
    client.release();
  }
}