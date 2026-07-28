-- CreateEnum
CREATE TYPE "FileModuleEnum" AS ENUM ('EXAMS', 'SUBMISSIONS', 'LIVE_RECORDINGS', 'PROFILES', 'DOCUMENTS', 'ASSIGNMENTS', 'IMPORTS', 'EXPORTS');

-- CreateEnum
CREATE TYPE "FileCategoryEnum" AS ENUM ('QUESTION_PAPER', 'ANSWER_SHEET', 'LIVE_RECORDING', 'PROFILE_PHOTO', 'DOCUMENT', 'IMAGE', 'SPREADSHEET', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "BucketTypeEnum" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable FileUploads
ALTER TABLE "FileUploads" DROP COLUMN IF EXISTS "fileName",
DROP COLUMN IF EXISTS "uploadStatus",
DROP COLUMN IF EXISTS "chunksTotal",
DROP COLUMN IF EXISTS "chunksUploaded",
DROP COLUMN IF EXISTS "storageObjectId",
DROP COLUMN IF EXISTS "version",
ADD COLUMN     "originalFileName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storedFileName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "fileType" "FileCategoryEnum" NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN     "moduleCode" "FileModuleEnum" NOT NULL DEFAULT 'DOCUMENTS',
ADD COLUMN     "bucket" "BucketTypeEnum" NOT NULL DEFAULT 'PRIVATE',
ALTER COLUMN   "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "FileUploads_tenantId_moduleCode_idx" ON "FileUploads"("tenantId", "moduleCode");
