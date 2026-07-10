-- ============================================================================
-- SQL File: 04.05_student_admissions.sql
-- Domain: Student Admissions Aggregate Root
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "student_admissions" is the root record for a student's enrollment in a
--    course. One student can have multiple admissions (re-admission, repeat
--    year, branch transfer).
-- 2. Admissions flow: Student → Admission → Course → Batch Enrollment.
--    Admission owns the course + academic_year context; batch enrollment is
--    a downstream child.
-- 3. fee_structure_id is captured at admission time to lock pricing (immutable
--    billing pattern). FK deferred until 09-fees bounded context exists.
-- 4. Everything downstream (attendance, exams, learning progress) references
--    student_admission_id, NOT raw student_profile_id.
-- 5. This table becomes the backbone of the entire ERP — fees, batches,
--    attendance, exams, learning, certificates, and analytics all derive
--    their enrollment context from this single record.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.student_admissions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    student_profile_id UUID NOT NULL,
    admission_number VARCHAR(30) NOT NULL,
    academic_year_id UUID NOT NULL,
    course_id UUID NOT NULL,
    branch_id UUID,
    fee_structure_id UUID,

    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    admission_status admission_status_enum NOT NULL DEFAULT 'ACTIVE',
    remarks TEXT,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_sa_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_sa_student FOREIGN KEY (student_profile_id)
        REFERENCES public.student_profiles(user_id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_sa_academic_year FOREIGN KEY (tenant_id, academic_year_id)
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_sa_course FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_sa_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- FK to fee_structures(id) — deferred until 09-fees bounded context exists
    -- CONSTRAINT fk_sa_fee_structure FOREIGN KEY (fee_structure_id)
    --     REFERENCES public.fee_structures(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_sa_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_sa_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_sa_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_sa_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_sa_admission_number CHECK (length(trim(admission_number)) > 0),
    CONSTRAINT chk_sa_admission_date CHECK (admission_date <= CURRENT_DATE),
    CONSTRAINT chk_sa_version CHECK (version > 0),

    -- Unique admission number per tenant
    CONSTRAINT uq_sa_admission_number UNIQUE (tenant_id, admission_number)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sa_tenant_id') THEN
        ALTER TABLE public.student_admissions ADD CONSTRAINT uq_sa_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sa_tenant_student ON public.student_admissions(tenant_id, student_profile_id, admission_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sa_tenant_course ON public.student_admissions(tenant_id, course_id, admission_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sa_tenant_academic_year ON public.student_admissions(tenant_id, academic_year_id, admission_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sa_tenant_branch ON public.student_admissions(tenant_id, branch_id) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sa_status ON public.student_admissions(tenant_id, admission_status, admission_date) WHERE deleted_at IS NULL;

-- Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_student_admission_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
    ay_tenant UUID;
    course_tenant UUID;
    branch_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles WHERE user_id = NEW.student_profile_id AND deleted_at IS NULL;

    IF student_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: student_profile tenant_id mismatch with admission';
    END IF;

    SELECT tenant_id INTO STRICT ay_tenant
    FROM public.academic_years WHERE id = NEW.academic_year_id AND deleted_at IS NULL;

    IF ay_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: academic_year tenant_id mismatch with admission';
    END IF;

    SELECT tenant_id INTO STRICT course_tenant
    FROM public.courses WHERE id = NEW.course_id AND deleted_at IS NULL;

    IF course_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: course tenant_id mismatch with admission';
    END IF;

    IF NEW.branch_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT branch_tenant
        FROM public.branches WHERE id = NEW.branch_id AND deleted_at IS NULL;

        IF branch_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: branch tenant_id mismatch with admission';
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student, academic_year, course, or branch does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_admission_tenant ON public.student_admissions;
CREATE TRIGGER trg_biu_student_admission_tenant
    BEFORE INSERT OR UPDATE ON public.student_admissions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_admission_tenant();

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_student_admissions_touch_audit ON public.student_admissions;
CREATE TRIGGER trg_bu_student_admissions_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_admissions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.student_admissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_sa_select ON public.student_admissions;
CREATE POLICY policy_sa_select
    ON public.student_admissions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_sa_insert ON public.student_admissions;
CREATE POLICY policy_sa_insert
    ON public.student_admissions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_sa_update ON public.student_admissions;
CREATE POLICY policy_sa_update
    ON public.student_admissions FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.student_admissions IS '⭐⭐⭐⭐⭐ Backbone of ERP — Student admission root record. One student can have multiple admissions. Everything downstream references this.';
COMMENT ON COLUMN public.student_admissions.student_profile_id IS 'Reference to the student profile (user)';
COMMENT ON COLUMN public.student_admissions.admission_number IS 'Unique admission number within tenant (e.g. ADP-2026-0001)';
COMMENT ON COLUMN public.student_admissions.academic_year_id IS 'Academic year this admission belongs to';
COMMENT ON COLUMN public.student_admissions.course_id IS 'Course the student is admitted to';
COMMENT ON COLUMN public.student_admissions.branch_id IS 'Physical branch the student is admitted to (nullable for single-branch institutes)';
COMMENT ON COLUMN public.student_admissions.fee_structure_id IS 'Fee structure locked at admission time (immutable billing). Deferred until 09-fees.';
COMMENT ON COLUMN public.student_admissions.admission_status IS 'Lifecycle: ENQUIRY, ACTIVE, ON_HOLD, DROPPED, COMPLETED, ALUMNI';
COMMENT ON COLUMN public.student_admissions.version IS 'Optimistic concurrency control version stamp';
