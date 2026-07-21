-- Drop global unique constraints
ALTER TABLE "Branches" DROP CONSTRAINT IF EXISTS "Branches_code_key";
ALTER TABLE "Branches" DROP CONSTRAINT IF EXISTS "Branches_slug_key";
ALTER TABLE "Branches" DROP CONSTRAINT IF EXISTS "Branches_email_key";
ALTER TABLE "Courses" DROP CONSTRAINT IF EXISTS "Courses_code_key";
ALTER TABLE "Chapters" DROP CONSTRAINT IF EXISTS "Chapters_code_key";
ALTER TABLE "Topics" DROP CONSTRAINT IF EXISTS "Topics_code_key";
ALTER TABLE "BatchDeliveryTypes" DROP CONSTRAINT IF EXISTS "BatchDeliveryTypes_code_key";
ALTER TABLE "Batches" DROP CONSTRAINT IF EXISTS "Batches_code_key";

-- Drop standard composite unique keys that block soft-delete reuse
ALTER TABLE "Branches" DROP CONSTRAINT IF EXISTS "Branches_tenantId_code_key";
ALTER TABLE "Branches" DROP CONSTRAINT IF EXISTS "Branches_tenantId_slug_key";
ALTER TABLE "Courses" DROP CONSTRAINT IF EXISTS "Courses_tenantId_code_key";
ALTER TABLE "Chapters" DROP CONSTRAINT IF EXISTS "Chapters_tenantId_code_key";
ALTER TABLE "Topics" DROP CONSTRAINT IF EXISTS "Topics_tenantId_code_key";
ALTER TABLE "BatchDeliveryTypes" DROP CONSTRAINT IF EXISTS "BatchDeliveryTypes_tenantId_code_key";
ALTER TABLE "Batches" DROP CONSTRAINT IF EXISTS "Batches_tenantId_code_key";

-- Create partial unique indexes (ignoring soft-deleted rows)
CREATE UNIQUE INDEX IF NOT EXISTS "Branches_tenantId_code_active_idx" ON "Branches"("tenantId", "code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Branches_tenantId_slug_active_idx" ON "Branches"("tenantId", "slug") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Branches_tenantId_email_active_idx" ON "Branches"("tenantId", "email") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Courses_tenantId_code_active_idx" ON "Courses"("tenantId", "code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "CourseSubjects_tenantId_courseId_subjectId_active_idx" ON "CourseSubjects"("tenantId", "courseId", "subjectId") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Chapters_tenantId_courseSubjectId_code_active_idx" ON "Chapters"("tenantId", "courseSubjectId", "code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Topics_tenantId_chapterId_code_active_idx" ON "Topics"("tenantId", "chapterId", "code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "BatchDeliveryTypes_tenantId_code_active_idx" ON "BatchDeliveryTypes"("tenantId", "code") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Batches_tenantId_code_active_idx" ON "Batches"("tenantId", "code") WHERE "deletedAt" IS NULL;

-- Create student active admission partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS "StudentAdmissions_tenantId_studentProfileId_courseId_academicYearId_active_idx" 
ON "StudentAdmissions"("tenantId", "studentProfileId", "courseId", "academicYearId") WHERE "deletedAt" IS NULL;
