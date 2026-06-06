import { prisma } from "../lib/prisma";

export const getWorkspaceStatsService = async (workspaceId: string) => {
  const [indexedDocuments, totalChunks] = await Promise.all([
    prisma.notionPage.count({
      where: { workspace_id: workspaceId },
    }),
    prisma.documentChunk.count({
      where: { workspace_id: workspaceId },
    }),
  ]);

  return { indexedDocuments, totalChunks };
};
