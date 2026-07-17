import { prisma } from "../lib/prisma";

export type DocumentListItem = {
  pageId: string;
  name: string;
  status: "completed";
};

export const getDocumentsService = async (
  workspaceId: string
): Promise<DocumentListItem[]> => {
  const pages = await prisma.notionPage.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { last_synced_at: "desc" },
    select: { id: true, title: true },
  });

  if (pages.length > 0) {
    return pages.map((page) => ({
      pageId: page.id,
      name: page.title,
      status: "completed" as const,
    }));
  }

  const chunks = await prisma.documentChunk.findMany({
    where: { workspace_id: workspaceId },
    select: { source_notion_id: true, source_title: true },
    distinct: ["source_notion_id"],
    orderBy: { created_at: "desc" },
  });

  return chunks
    .filter((chunk) => chunk.source_title)
    .map((chunk) => ({
      pageId: chunk.source_notion_id,
      name: chunk.source_title!,
      status: "completed" as const,
    }));
};
