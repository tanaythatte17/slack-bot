import crypto from "crypto";
import { Client } from "@notionhq/client";
import { prisma } from "../lib/prisma";
import { decryptToken } from "../utils/crypto";
import {
  getNotionPages,
  extractPageChunks,
  type NotionPageMeta,
} from "../utils/notionUtils";
import { embedChunks, storeChunks } from "../utils/embedUtils";
import sseService from "./sseService";
import { syncProgressService } from "./syncProgressService";

function pageHash(page: NotionPageMeta, changedCount: number) {
  return crypto
    .createHash("sha256")
    .update(`${page.id}:${page.lastEditedTime}:${changedCount}`)
    .digest("hex");
}

async function upsertNotionPage(
  workspaceId: string,
  page: NotionPageMeta,
  hash: string
) {
  await prisma.notionPage.upsert({
    where: { id: page.id },
    create: {
      id: page.id,
      workspace_id: workspaceId,
      title: page.title,
      page_hash: hash,
    },
    update: {
      title: page.title,
      page_hash: hash,
    },
  });
}

function emitDocumentUpdate(
  userId: string,
  workspaceId: string,
  pageId: string,
  name: string,
  status: "in_progress" | "completed" | "failed"
) {
  const update = { pageId, name, status };
  syncProgressService.updateDocument(workspaceId, update);
  sseService.sendDocumentUpdate(userId, update);
}

export const indexWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace?.notion_token) {
    throw new Error("Notion not connected");
  }

  const syncJob = await prisma.syncJob.create({
    data: {
      workspace_id: workspaceId,
      status: "running",
      started_at: new Date(),
    },
  });

  syncProgressService.start(workspaceId, syncJob.id);
  sseService.sendSyncStatus(userId, "started", "Indexing started");

  const notion = new Client({ auth: decryptToken(workspace.notion_token) });
  let pagesFound = 0;
  let chunksIndexed = 0;

  try {
    const pages = await getNotionPages(notion);
    pagesFound = pages.length;

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { pages_found: pagesFound },
    });

    for (const page of pages) {
      emitDocumentUpdate(
        userId,
        workspaceId,
        page.id,
        page.title,
        "in_progress"
      );

      const changedChunks = await extractPageChunks(
        notion,
        workspaceId,
        page
      );

      if (changedChunks.length > 0) {
        const embeddings = await embedChunks(changedChunks);
        await storeChunks(workspaceId, changedChunks, embeddings);
        chunksIndexed += changedChunks.length;
      }

      await upsertNotionPage(
        workspaceId,
        page,
        pageHash(page, changedChunks.length)
      );

      emitDocumentUpdate(
        userId,
        workspaceId,
        page.id,
        page.title,
        "completed"
      );
    }

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "complete",
        chunks_indexed: chunksIndexed,
        completed_at: new Date(),
      },
    });

    sseService.sendSyncStatus(userId, "completed", "Indexing complete", {
      pagesFound,
      chunksIndexed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Indexing failed";

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "failed",
        error_message: message,
        completed_at: new Date(),
      },
    });

    sseService.sendSyncStatus(userId, "error", message);
    throw error;
  } finally {
    syncProgressService.clear(workspaceId);
  }
};
