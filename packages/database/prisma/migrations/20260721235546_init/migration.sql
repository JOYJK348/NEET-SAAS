/*
  Warnings:

  - You are about to drop the column `version` on the `AcademicYears` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TopicItemType" AS ENUM ('TEXT', 'PDF', 'LINK', 'VIDEO', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "TopicItemStatusType" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CompletionRuleType" AS ENUM ('NONE', 'OPEN', 'WATCH_80_PERCENT', 'WATCHED_FULL');

-- DropIndex
DROP INDEX "BatchDeliveryTypes_code_key";

-- DropIndex
DROP INDEX "BatchDeliveryTypes_tenantId_code_key";

-- DropIndex
DROP INDEX "Batches_code_key";

-- DropIndex
DROP INDEX "Batches_tenantId_code_key";

-- DropIndex
DROP INDEX "Branches_code_key";

-- DropIndex
DROP INDEX "Branches_email_key";

-- DropIndex
DROP INDEX "Branches_slug_key";

-- DropIndex
DROP INDEX "Branches_tenantId_code_key";

-- DropIndex
DROP INDEX "Branches_tenantId_slug_key";

-- DropIndex
DROP INDEX "Chapters_code_key";

-- DropIndex
DROP INDEX "Chapters_tenantId_code_key";

-- DropIndex
DROP INDEX "Courses_code_key";

-- DropIndex
DROP INDEX "Courses_tenantId_code_key";

-- DropIndex
DROP INDEX "Topics_code_key";

-- DropIndex
DROP INDEX "Topics_tenantId_code_key";

-- AlterTable
ALTER TABLE "AcademicYears" DROP COLUMN "version";

-- AlterTable
ALTER TABLE "Batches" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "Branches" ADD COLUMN     "academicYearId" TEXT;

-- AlterTable
ALTER TABLE "Courses" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudentParents" ALTER COLUMN "updatedBy" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BranchCourses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BranchCourses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicItems" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "type" "TopicItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "metadata" JSONB,
    "assessmentId" TEXT,
    "status" "TopicItemStatusType" NOT NULL DEFAULT 'DRAFT',
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "durationMins" INTEGER,
    "completionRule" "CompletionRuleType" NOT NULL DEFAULT 'NONE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TopicItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchCourses_tenantId_branchId_idx" ON "BranchCourses"("tenantId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchCourses_tenantId_id_key" ON "BranchCourses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BranchCourses_tenantId_branchId_courseId_academicYearId_key" ON "BranchCourses"("tenantId", "branchId", "courseId", "academicYearId");

-- CreateIndex
CREATE INDEX "TopicItems_tenantId_topicId_displayOrder_idx" ON "TopicItems"("tenantId", "topicId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TopicItems_tenantId_id_key" ON "TopicItems"("tenantId", "id");

-- CreateIndex
CREATE INDEX "BatchDeliveryTypes_tenantId_code_idx" ON "BatchDeliveryTypes"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Batches_tenantId_code_idx" ON "Batches"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Branches_tenantId_code_idx" ON "Branches"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Branches_tenantId_slug_idx" ON "Branches"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Branches_tenantId_email_idx" ON "Branches"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Chapters_tenantId_courseSubjectId_code_idx" ON "Chapters"("tenantId", "courseSubjectId", "code");

-- CreateIndex
CREATE INDEX "CourseSubjects_tenantId_courseId_subjectId_idx" ON "CourseSubjects"("tenantId", "courseId", "subjectId");

-- CreateIndex
CREATE INDEX "Courses_tenantId_code_idx" ON "Courses"("tenantId", "code");

-- CreateIndex
CREATE INDEX "StudentAdmissions_tenantId_studentProfileId_courseId_academ_idx" ON "StudentAdmissions"("tenantId", "studentProfileId", "courseId", "academicYearId");

-- CreateIndex
CREATE INDEX "Topics_tenantId_chapterId_code_idx" ON "Topics"("tenantId", "chapterId", "code");

-- AddForeignKey
ALTER TABLE "Branches" ADD CONSTRAINT "Branches_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYears"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchCourses" ADD CONSTRAINT "BranchCourses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchCourses" ADD CONSTRAINT "BranchCourses_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYears"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchCourses" ADD CONSTRAINT "BranchCourses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicItems" ADD CONSTRAINT "TopicItems_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicItems" ADD CONSTRAINT "TopicItems_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batches" ADD CONSTRAINT "Batches_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParents" ADD CONSTRAINT "StudentParents_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParents" ADD CONSTRAINT "StudentParents_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
