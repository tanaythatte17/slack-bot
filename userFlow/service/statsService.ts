import { prisma } from "../lib/prisma";

export const getWorkspaceStatsService = async (workspaceId: string) => {
  const [notionPageCount, distinctPages, totalChunks] = await Promise.all([
    prisma.notionPage.count({
      where: { workspace_id: workspaceId },
    }),
    prisma.documentChunk.findMany({
      where: { workspace_id: workspaceId },
      select: { source_notion_id: true },
      distinct: ["source_notion_id"],
    }),
    prisma.documentChunk.count({
      where: { workspace_id: workspaceId },
    }),
  ]);

  const indexedDocuments =
    notionPageCount > 0 ? notionPageCount : distinctPages.length;

  return { indexedDocuments, totalChunks };
};
