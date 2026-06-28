/*
  Warnings:

  - A unique constraint covering the columns `[notion_block_id]` on the table `DocumentChunk` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content_hash` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notion_block_id` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DocumentChunk_workspace_id_source_notion_id_idx";

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "content_hash" TEXT NOT NULL,
ADD COLUMN     "heading_path" JSONB,
ADD COLUMN     "notion_block_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_notion_block_id_key" ON "DocumentChunk"("notion_block_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_source_notion_id_idx" ON "DocumentChunk"("source_notion_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_notion_block_id_idx" ON "DocumentChunk"("notion_block_id");
