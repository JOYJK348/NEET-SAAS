-- AlterTable: StudentParents - add audit fields
ALTER TABLE "StudentParents" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "StudentParents" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StudentParents" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "StudentParents" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "StudentParents" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex: EmergencyContacts - replace global unique with tenant-scoped unique
DROP INDEX IF EXISTS "EmergencyContacts_email_key";
CREATE UNIQUE INDEX "EmergencyContacts_tenantId_email_key" ON "EmergencyContacts"("tenantId", "email");
CREATE INDEX "EmergencyContacts_tenantId_studentProfileId_idx" ON "EmergencyContacts"("tenantId", "studentProfileId");

-- CreateIndex: StaffProfiles
CREATE INDEX "StaffProfiles_tenantId_employeeCode_idx" ON "StaffProfiles"("tenantId", "employeeCode");
CREATE INDEX "StaffProfiles_tenantId_employmentStatus_idx" ON "StaffProfiles"("tenantId", "employmentStatus");

-- CreateIndex: StudentProfiles
CREATE INDEX "StudentProfiles_tenantId_studentCode_idx" ON "StudentProfiles"("tenantId", "studentCode");
CREATE INDEX "StudentProfiles_tenantId_academicStatus_idx" ON "StudentProfiles"("tenantId", "academicStatus");

-- CreateIndex: StudentAdmissions
CREATE INDEX "StudentAdmissions_tenantId_branchId_idx" ON "StudentAdmissions"("tenantId", "branchId");
CREATE INDEX "StudentAdmissions_tenantId_academicYearId_admissionStatus_idx" ON "StudentAdmissions"("tenantId", "academicYearId", "admissionStatus");

-- CreateIndex: StudentBatchEnrollments
CREATE INDEX "StudentBatchEnrollments_tenantId_batchId_status_idx" ON "StudentBatchEnrollments"("tenantId", "batchId", "status");
CREATE INDEX "StudentBatchEnrollments_tenantId_studentAdmissionId_batchId_idx" ON "StudentBatchEnrollments"("tenantId", "studentAdmissionId", "batchId");

-- CreateIndex: StaffBatchAssignments
CREATE INDEX "StaffBatchAssignments_tenantId_batchId_idx" ON "StaffBatchAssignments"("tenantId", "batchId");
CREATE INDEX "StaffBatchAssignments_tenantId_staffProfileId_batchId_idx" ON "StaffBatchAssignments"("tenantId", "staffProfileId", "batchId");

-- CreateIndex: StudentMedicalProfiles
CREATE INDEX "StudentMedicalProfiles_tenantId_studentProfileId_idx" ON "StudentMedicalProfiles"("tenantId", "studentProfileId");

-- CreateIndex: StudentParents
CREATE INDEX "StudentParents_tenantId_parentProfileId_idx" ON "StudentParents"("tenantId", "parentProfileId");
CREATE INDEX "StudentParents_tenantId_studentProfileId_isPrimaryGuardian_idx" ON "StudentParents"("tenantId", "studentProfileId", "isPrimaryGuardian");
