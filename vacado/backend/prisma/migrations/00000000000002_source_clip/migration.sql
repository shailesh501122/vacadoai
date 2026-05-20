-- AlterTable: allow per-Short user-uploaded source clip
ALTER TABLE "shorts" ADD COLUMN "sourceClipUrl" TEXT;
