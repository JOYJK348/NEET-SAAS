-- AlterEnum: Add new values to ExamPublishStatusEnum
ALTER TYPE "ExamPublishStatusEnum" ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE "ExamPublishStatusEnum" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "ExamPublishStatusEnum" ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW';
ALTER TYPE "ExamPublishStatusEnum" ADD VALUE IF NOT EXISTS 'RESULT_PUBLISHED';

-- CreateEnum: SubmissionTimelineEvent
CREATE TYPE "SubmissionTimelineEvent" AS ENUM (
  'STARTED',
  'QP_DOWNLOADED',
  'ANSWER_SHEET_UPLOADED',
  'ANSWER_SHEET_REPLACED',
  'HEARTBEAT',
  'TUTOR_OPENED',
  'EVALUATED',
  'RETURNED',
  'APPROVED',
  'RESULTS_PUBLISHED'
);

-- CreateEnum: SubmissionFileTypeEnum
CREATE TYPE "SubmissionFileTypeEnum" AS ENUM (
  'CURRENT',
  'OLD',
  'REPLACED'
);

-- AlterTable: Exams
ALTER TABLE "Exams"
ADD COLUMN IF NOT EXISTS "graceMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "examWindowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "examWindowEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "requireFullDurationWindow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "allowLateUpload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "allowReplaceUpload" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "sectionConfig" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "omrTemplateFileId" TEXT,
ADD COLUMN IF NOT EXISTS "omrTemplateSchema" JSONB,
ADD COLUMN IF NOT EXISTS "evaluationLockedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "evaluationLockedBy" TEXT;

-- AlterTable: ExamSubmissions
ALTER TABLE "ExamSubmissions"
ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "calculatedEndAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "graceEndAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "qpDownloadedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "evaluationVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "evaluationApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "aiConfidenceScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "aiDetectedAnswers" JSONB,
ADD COLUMN IF NOT EXISTS "rank" INTEGER,
ADD COLUMN IF NOT EXISTS "percentile" DOUBLE PRECISION;

-- CreateTable: ExamSubmissionTimeline
CREATE TABLE IF NOT EXISTS "ExamSubmissionTimeline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "event" "SubmissionTimelineEvent" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ExamSubmissionTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExamSubmissionFiles
CREATE TABLE IF NOT EXISTS "ExamSubmissionFiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "fileType" "SubmissionFileTypeEnum" NOT NULL DEFAULT 'CURRENT',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "ExamSubmissionFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for ExamSubmissionTimeline
CREATE INDEX IF NOT EXISTS "ExamSubmissionTimeline_submissionId_idx" ON "ExamSubmissionTimeline"("submissionId");
CREATE INDEX IF NOT EXISTS "ExamSubmissionTimeline_tenantId_submissionId_idx" ON "ExamSubmissionTimeline"("tenantId", "submissionId");
CREATE INDEX IF NOT EXISTS "ExamSubmissionTimeline_tenantId_event_createdAt_idx" ON "ExamSubmissionTimeline"("tenantId", "event", "createdAt");

-- CreateIndexes for ExamSubmissionFiles
CREATE INDEX IF NOT EXISTS "ExamSubmissionFiles_submissionId_idx" ON "ExamSubmissionFiles"("submissionId");
CREATE INDEX IF NOT EXISTS "ExamSubmissionFiles_tenantId_submissionId_idx" ON "ExamSubmissionFiles"("tenantId", "submissionId");

-- AddForeignKey for ExamSubmissionTimeline
ALTER TABLE "ExamSubmissionTimeline"
ADD CONSTRAINT "ExamSubmissionTimeline_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "ExamSubmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for ExamSubmissionFiles
ALTER TABLE "ExamSubmissionFiles"
ADD CONSTRAINT "ExamSubmissionFiles_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "ExamSubmissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamSubmissionFiles"
ADD CONSTRAINT "ExamSubmissionFiles_fileUploadId_fkey"
FOREIGN KEY ("fileUploadId") REFERENCES "FileUploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
