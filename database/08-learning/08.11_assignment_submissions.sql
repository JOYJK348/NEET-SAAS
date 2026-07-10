-- ============================================================================
-- SQL File: 08.11_assignment_submissions.sql
-- Domain: Student Assignment Submissions
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. One row per student submission per assignment attempt.
-- 2. Supports resubmission: attempt_number + is_latest for multi-attempt
--    assignments.
-- 3. submitted_by_ai flag for AI-generated/auto-submitted assignments.
-- 4. late_submission flag to differentiate on-time vs late work.
-- 5. storage_object_id for file-based submissions (PDF, images, etc.).
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    assignment_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,

    submitted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    marks DECIMAL(5,2),
    feedback TEXT,
    evaluated_by UUID,
    evaluated_at TIMESTAMP WITH TIME ZONE,

    submitted_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    late_submission BOOLEAN NOT NULL DEFAULT FALSE,
    storage_object_id UUID,

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
    CONSTRAINT fk_as_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_as_assignment FOREIGN KEY (tenant_id, assignment_id)
        REFERENCES public.material_assignments(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_as_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_as_evaluated_by FOREIGN KEY (evaluated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_as_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_as_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT chk_as_marks CHECK (marks IS NULL OR marks >= 0),
    CONSTRAINT chk_as_status CHECK (status IN ('PENDING', 'SUBMITTED', 'EVALUATED', 'RETURNED', 'LATE')),
    CONSTRAINT chk_as_version CHECK (version > 0),

    -- One attempt per assignment per admission
    CONSTRAINT uq_as_attempt UNIQUE (assignment_id, student_admission_id, attempt_number)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_as_tenant_id') THEN
        ALTER TABLE public.assignment_submissions ADD CONSTRAINT uq_as_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_as_assignment ON public.assignment_submissions(assignment_id, student_admission_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_as_student ON public.assignment_submissions(student_admission_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_as_tenant ON public.assignment_submissions(tenant_id, assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_as_latest ON public.assignment_submissions(assignment_id, is_latest) WHERE is_latest = true AND deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_as_touch_audit ON public.assignment_submissions;
CREATE TRIGGER trg_bu_as_touch_audit
    BEFORE INSERT OR UPDATE ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_as_select ON public.assignment_submissions;
CREATE POLICY policy_as_select
    ON public.assignment_submissions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_as_insert ON public.assignment_submissions;
CREATE POLICY policy_as_insert
    ON public.assignment_submissions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_as_update ON public.assignment_submissions;
CREATE POLICY policy_as_update
    ON public.assignment_submissions FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.assignment_submissions IS 'Student assignment submissions with multi-attempt support and evaluation tracking';
COMMENT ON COLUMN public.assignment_submissions.attempt_number IS 'Submission attempt number (1, 2, 3, ...) for resubmission support';
COMMENT ON COLUMN public.assignment_submissions.is_latest IS 'True if this is the most recent attempt (for quick latest-submission queries)';
COMMENT ON COLUMN public.assignment_submissions.status IS 'Submission status: PENDING, SUBMITTED, EVALUATED, RETURNED, LATE';
COMMENT ON COLUMN public.assignment_submissions.submitted_by_ai IS 'True if submitted automatically by AI system';
COMMENT ON COLUMN public.assignment_submissions.late_submission IS 'True if submitted after the due date';
COMMENT ON COLUMN public.assignment_submissions.storage_object_id IS 'Optional reference to uploaded file (PDF, image) for file-based submissions';
COMMENT ON COLUMN public.assignment_submissions.version IS 'Optimistic concurrency control version stamp';
