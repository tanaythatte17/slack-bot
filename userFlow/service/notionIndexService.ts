// service/notionIndexService.ts

import { Client } from "@notionhq/client";
import {prisma} from "../lib/prisma"
import { getAllBlocks ,extractTextFromBlocks, chunkText, generateHash } from "../utils/indexUtils";
import { embedBatch } from "../utils/embedUtils";

export const indexWorkspaceService = async (workspaceId: string) => {
  console.log(`Starting sync for workspace: ${workspaceId}`);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace?.notion_token) {
    throw new Error("Notion not connected");
  }

  const notion = new Client({
    auth: workspace.notion_token,
  });

  const { results: pages } = await notion.search({
    filter: { property: "object", value: "page" },
  });
  console.log('Pages are', pages);
  let totalChunks = 0;

  for (const page of pages) {
    if (page.object !== "page") continue;

    const pageId = page.id;

    const titleProp = (page as any).properties?.title?.title;
    const title = titleProp?.[0]?.plain_text ?? "Untitled";

    // 🔥 Fetch all blocks (paginated)
    console.log('Page id is', pageId);
    const blocks = await getAllBlocks(notion, pageId);
    const pageText = extractTextFromBlocks(blocks);
    
    const existingPage = await prisma.notionPage.findUnique({
      where: {
        id: pageId
      }
    });

    const currentHash = generateHash(pageText);

    if (existingPage?.page_hash === currentHash) {
      console.log("Skipping unchanged page");
      continue;
    }

    await prisma.notionPage.upsert({
      where: { id: pageId },
      update: { page_hash: currentHash },
      create: {
        id: pageId,
        workspace_id: workspaceId,
        title,
        page_hash: currentHash,
      }
    })

    if (!pageText.trim()) continue;

    const chunks = chunkText(pageText);
    if (chunks.length === 0) continue;

    const embeddings = await embedBatch(chunks);

    // 🔥 Delete only this page's old chunks
    await prisma.documentChunk.deleteMany({
      where: {
        workspace_id: workspaceId,
        source_notion_id: pageId,
      },
    });

    // 🔥 Insert new chunks
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "DocumentChunk"
      (
        id,
        workspace_id,
        content,
        source_notion_id,
        source_url,
        source_title,
        chunk_index,
        embedding
      )
      VALUES
      ${chunks
        .map(
          (_, i) => `
          (
            gen_random_uuid(),
            '${workspaceId}',
            $${i * 4 + 1},
            '${pageId}',
            '${"https://notion.so/" + pageId.replace(/-/g, "")}',
            $${i * 4 + 2},
            $${i * 4 + 3},
            $${i * 4 + 4}::vector
          )
        `
        )
        .join(",")}
      `,
      ...chunks.flatMap((chunk, i) => [
        chunk,                         // $1
        title,                         // $2
        i,                             // $3
        JSON.stringify(embeddings[i]), // $4
      ])
    );

    totalChunks += chunks.length;

    console.log(`Indexed "${title}" (${chunks.length} chunks)`);
  }

  console.log(`Sync complete: ${totalChunks} chunks`);
};