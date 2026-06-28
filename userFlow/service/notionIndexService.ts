// service/notionIndexService.ts

import { Client } from "@notionhq/client";
import {prisma} from "../lib/prisma"
import { extractNotionChunks } from "../utils/notionUtils";
import {
  embedChunks,
  storeChunks,
} from "../utils/embedUtils";

export const indexWorkspaceService = async (
  workspaceId: string
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace?.notion_token) {
    throw new Error("Notion not connected");
  }

  const notion = new Client({
    auth: workspace.notion_token,
  });

  // Step 1: Extract only changed chunks
  const changedChunks = await extractNotionChunks(
    notion,
    workspaceId
  );

  if (!changedChunks.length) {
    console.log("No changed chunks found");
    return;
  }

  // Step 2: Embed
  const embeddings = await embedChunks(
    changedChunks
  );

  // Step 3: Store
  await storeChunks(
    workspaceId,
    changedChunks,
    embeddings
  );

  console.log(
    `Sync complete: ${changedChunks.length} chunks indexed`
  );
};