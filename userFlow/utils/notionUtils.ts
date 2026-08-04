import crypto from "crypto";
import { Client, isFullBlock, isFullPage } from "@notionhq/client";
import type {
  BlockObjectResponse,
  RichTextItemResponse,
  PageObjectResponse,
} from "@notionhq/client";
import {prisma} from "../lib/prisma"

export type NotionPageMeta = {
  id: string;
  title: string;
  lastEditedTime: string;
};

export type FlatBlock = {
  id: string;
  type: string;
  text: string;
  lastEditedTime: string;
  headingPath: string[];
  headingLevel?: 1 | 2 | 3;
};

export type Chunk = {
  chunkId: string;
  blockId: string;
  splitIndex: number;
  content: string;
  headingPath: string[];
  headingLevel?: 1 | 2 | 3;
  blockType: string;
  blockLastEditedTime: string;
};

export type ChunkToEmbed = Chunk & {
  hash: string;
  pageId: string;
  pageTitle: string;
};

const MAX_CHUNK_CHARS = 1200;

export async function getNotionPages(
  notion: Client
): Promise<NotionPageMeta[]> {
  return getAllPages(notion);
}

export async function extractPageChunks(
  notion: Client,
  workspaceId: string,
  page: NotionPageMeta
): Promise<ChunkToEmbed[]> {
  const blocks = await getAllBlocksFlat(notion, page.id);
  const chunks = chunkBlocks(blocks);

  const existingRows = await prisma.documentChunk.findMany({
    where: {
      workspace_id: workspaceId,
      source_notion_id: page.id,
    },
    select: {
      notion_block_id: true,
      content_hash: true,
    },
  });

  const existingMap = new Map(
    existingRows.map((row) => [row.notion_block_id, row.content_hash])
  );

  const changedChunks: ChunkToEmbed[] = [];

  for (const chunk of chunks) {
    const hash = generateHash(chunk.content);
    const existingHash = existingMap.get(chunk.chunkId);

    if (existingHash === hash) continue;

    changedChunks.push({
      ...chunk,
      hash,
      pageId: page.id,
      pageTitle: page.title,
    });
  }

  return changedChunks;
}

async function getAllPages(
  notion: Client
): Promise<NotionPageMeta[]> {
  const pages: NotionPageMeta[] = [];
  let cursor: string | undefined;

  while (true) {
    const response = await notion.search({
      filter: { property: "object", value: "page" },
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (!isFullPage(result)) continue;

      pages.push({
        id: result.id,
        title: extractPageTitle(result),
        lastEditedTime: result.last_edited_time,
      });
    }

    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }

  return pages;
}

function extractPageTitle(page: PageObjectResponse): string {
  const props = page.properties as Record<string, any>;

  const titleProp =
    props["title"] ??
    props["Name"] ??
    Object.values(props).find((p: any) => p.type === "title");

  if (!titleProp || titleProp.type !== "title")
    return "Untitled";

  return (titleProp.title as RichTextItemResponse[])
    .map((t) => t.plain_text)
    .join("");
}

async function getAllBlocksFlat(
  notion: Client,
  rootId: string
): Promise<FlatBlock[]> {
  const result: FlatBlock[] = [];
  const headingStack: [string, string, string] = ["", "", ""];

  await walkBlocks(notion, rootId, headingStack, result);

  return result;
}

async function walkBlocks(
  notion: Client,
  blockId: string,
  headingStack: [string, string, string],
  acc: FlatBlock[]
): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const raw of response.results) {
      if (!isFullBlock(raw)) continue;

      const block = raw as BlockObjectResponse;
      const text = getBlockText(block);
      const level = headingLevel(block);
      const snapshot = [...headingStack] as [
        string,
        string,
        string
      ];

      if (level === 1) {
        headingStack[0] = text;
        headingStack[1] = "";
        headingStack[2] = "";
      }

      if (level === 2) {
        headingStack[1] = text;
        headingStack[2] = "";
      }

      if (level === 3) {
        headingStack[2] = text;
      }

      if (text) {
        acc.push({
          id: block.id,
          type: block.type,
          text,
          lastEditedTime: block.last_edited_time,
          headingPath: (level ? snapshot : headingStack)
            .filter(Boolean),
          headingLevel: level,
        });
      }

      if (block.has_children) {
        await walkBlocks(
          notion,
          block.id,
          headingStack,
          acc
        );
      }
    }

    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }
}

function getBlockText(block: BlockObjectResponse): string {
  const b = block as any;
  const type = block.type;

  if (b[type]?.rich_text) {
    return b[type].rich_text
      .map((t: any) => t.plain_text)
      .join("");
  }

  return "";
}

function headingLevel(
  block: BlockObjectResponse
): 1 | 2 | 3 | undefined {
  if (block.type === "heading_1") return 1;
  if (block.type === "heading_2") return 2;
  if (block.type === "heading_3") return 3;
}

function chunkBlocks(blocks: FlatBlock[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const block of blocks) {
    const segments = split(block.text);

    segments.forEach((segment, idx) => {
      chunks.push({
        chunkId:
          segments.length === 1
            ? block.id
            : `${block.id}:${idx}`,
        blockId: block.id,
        splitIndex: idx,
        content: segment,
        headingPath: block.headingPath,
        headingLevel: block.headingLevel,
        blockType: block.type,
        blockLastEditedTime: block.lastEditedTime,
      });
    });
  }

  return chunks;
}

function split(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const result = [];

  for (
    let i = 0;
    i < text.length;
    i += MAX_CHUNK_CHARS
  ) {
    result.push(text.slice(i, i + MAX_CHUNK_CHARS));
  }

  return result;
}

function generateHash(content: string) {
  return crypto
    .createHash("sha256")
    .update(content, "utf8")
    .digest("hex");
}