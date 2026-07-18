-- AlterEnum
BEGIN;
CREATE TYPE "AdmissionStatusEnum_new" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "StudentAdmissions" ALTER COLUMN "admissionStatus" TYPE "AdmissionStatusEnum_new" USING ("admissionStatus"::text::"AdmissionStatusEnum_new");
ALTER TYPE "AdmissionStatusEnum" RENAME TO "AdmissionStatusEnum_old";
ALTER TYPE "AdmissionStatusEnum_new" RENAME TO "AdmissionStatusEnum";
DROP TYPE "public"."AdmissionStatusEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "StudentAdmissions" ALTER COLUMN "feeStructureId" DROP NOT NULL,
ALTER COLUMN "remarks" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AdmissionStatusHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "fromStatus" "AdmissionStatusEnum" NOT NULL,
    "toStatus" "AdmissionStatusEnum" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AdmissionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionStatusHistory_tenantId_admissionId_idx" ON "AdmissionStatusHistory"("tenantId", "admissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionStatusHistory_tenantId_id_key" ON "AdmissionStatusHistory"("tenantId", "id");

-- CreateIndex
CREATE INDEX "StudentAdmissions_tenantId_studentProfileId_academicYearId__idx" ON "StudentAdmissions"("tenantId", "studentProfileId", "academicYearId", "admissionStatus");

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "StudentAdmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
