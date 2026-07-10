-- ============================================================================
-- SQL File: 04.06_student_batch_enrollments.sql
-- Domain: Student Batch Enrollments Mappings
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table mapping admissions to batches. Admission owns course +
--    academic_year context; this table only tracks batch assignment.
-- 2. Composite primary key is omitted to allow historical re-enrolling tracks,
--    using surrogate ID instead.
-- 3. Tracks status (ACTIVE, COMPLETED, WITHDRAWN, SUSPENDED), joined_at,
--    left_at, and is_primary flag.
-- 4. Ensures referential integrity: cascade deletes admission mappings,
--    restricts deletions of batch resources.
-- 5. Enables RLS allowing selections to Super Admins, staff, self, and
--    mapped parents.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.student_batch_enrollments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_admission_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    tenant_id UUID NOT NULL,

    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at DATE NULL,

    status batch_status_type NOT NULL DEFAULT 'ACTIVE',
    is_primary BOOLEAN NOT NULL DEFAULT true,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_sbe_admission FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_sbe_batch FOREIGN KEY (tenant_id, batch_id)
        REFERENCES public.batches(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_sbe_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_sbe_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_sbe_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_sbe_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_sbe_duration CHECK (left_at IS NULL OR left_at >= joined_at),
    CONSTRAINT chk_sbe_version CHECK (version > 0),
    CONSTRAINT uq_sbe_tenant_id UNIQUE (tenant_id, id)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sbe_tenant_id') THEN
        ALTER TABLE public.student_batch_enrollments ADD CONSTRAINT uq_sbe_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sbe_admission_lookup ON public.student_batch_enrollments(student_admission_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sbe_batch_lookup ON public.student_batch_enrollments(batch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sbe_tenant_lookup ON public.student_batch_enrollments(tenant_id) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sbe_primary_active
    ON public.student_batch_enrollments(student_admission_id)
    WHERE is_primary = true AND status = 'ACTIVE' AND deleted_at IS NULL;

-- Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_student_batch_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admission_tenant UUID;
    batch_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT admission_tenant
    FROM public.student_admissions
    WHERE id = NEW.student_admission_id
      AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT batch_tenant
    FROM public.batches
    WHERE id = NEW.batch_id
      AND deleted_at IS NULL;

    IF admission_tenant <> NEW.tenant_id OR batch_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across admission, batch, and enrollment records';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated admission or batch does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_batch_enrollment_validation ON public.student_batch_enrollments;
CREATE TRIGGER trg_biu_student_batch_enrollment_validation
    BEFORE INSERT OR UPDATE ON public.student_batch_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_batch_enrollment();

DROP TRIGGER IF EXISTS trg_bu_student_batch_enrollments_touch_audit ON public.student_batch_enrollments;
CREATE TRIGGER trg_bu_student_batch_enrollments_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_batch_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.student_batch_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_sbe_select ON public.student_batch_enrollments;
CREATE POLICY policy_sbe_select
    ON public.student_batch_enrollments
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR EXISTS (
                SELECT 1 FROM public.student_admissions sa
                WHERE sa.id = student_batch_enrollments.student_admission_id
                  AND sa.student_profile_id = auth.uid()
                  AND sa.deleted_at IS NULL
            )
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                      AND user_type = 'STAFF'::user_type_enum
                      AND deleted_at IS NULL
                )
            )
            OR EXISTS (
                SELECT 1
                FROM public.student_admissions sa
                JOIN public.student_parents sp ON sp.student_profile_id = sa.student_profile_id
                JOIN public.parent_profiles pp ON pp.user_id = sp.parent_profile_id
                WHERE sa.id = student_batch_enrollments.student_admission_id
                  AND pp.user_id = auth.uid()
                  AND pp.deleted_at IS NULL
            )
        )
    );

COMMENT ON TABLE public.student_batch_enrollments IS 'Workforce cohort assignments (mapping student admissions to batches)';
COMMENT ON COLUMN public.student_batch_enrollments.student_admission_id IS 'FK to the student admission record';
COMMENT ON COLUMN public.student_batch_enrollments.batch_id IS 'Key mapping batch details records';
COMMENT ON COLUMN public.student_batch_enrollments.joined_at IS 'Historical joined date identifier';
COMMENT ON COLUMN public.student_batch_enrollments.left_at IS 'Historical left date identifier';
COMMENT ON COLUMN public.student_batch_enrollments.version IS 'Optimistic concurrency control version stamp';
