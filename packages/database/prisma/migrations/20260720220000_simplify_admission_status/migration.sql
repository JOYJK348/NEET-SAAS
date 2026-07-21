-- Simplify AdmissionStatusEnum to ACTIVE / INACTIVE only
-- Map old values: PENDING -> ACTIVE, CONFIRMED -> ACTIVE, ACTIVE -> ACTIVE, COMPLETED -> INACTIVE, CANCELLED -> INACTIVE

-- 1. Create new enum type
CREATE TYPE "AdmissionStatusEnum_new" AS ENUM ('ACTIVE', 'INACTIVE');

-- 2. Alter columns to use new type with mapping
ALTER TABLE "StudentAdmissions"
  ALTER COLUMN "admissionStatus" TYPE "AdmissionStatusEnum_new"
  USING (
    CASE "admissionStatus"::text
      WHEN 'PENDING' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'CONFIRMED' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'ACTIVE' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'COMPLETED' THEN 'INACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'CANCELLED' THEN 'INACTIVE'::"AdmissionStatusEnum_new"
    END
  );

ALTER TABLE "AdmissionStatusHistory"
  ALTER COLUMN "fromStatus" TYPE "AdmissionStatusEnum_new"
  USING (
    CASE "fromStatus"::text
      WHEN 'PENDING' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'CONFIRMED' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'ACTIVE' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'COMPLETED' THEN 'INACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'CANCELLED' THEN 'INACTIVE'::"AdmissionStatusEnum_new"
    END
  );

ALTER TABLE "AdmissionStatusHistory"
  ALTER COLUMN "toStatus" TYPE "AdmissionStatusEnum_new"
  USING (
    CASE "toStatus"::text
      WHEN 'PENDING' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'CONFIRMED' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'ACTIVE' THEN 'ACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'COMPLETED' THEN 'INACTIVE'::"AdmissionStatusEnum_new"
      WHEN 'CANCELLED' THEN 'INACTIVE'::"AdmissionStatusEnum_new"
    END
  );

-- 3. Drop old type and rename new one
DROP TYPE "AdmissionStatusEnum";
ALTER TYPE "AdmissionStatusEnum_new" RENAME TO "AdmissionStatusEnum";
