-- ============================================================================
-- SQL File: 06.07_exam_results.sql
-- Domain: Exam Final Computed Results
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. One result row per student per exam — computed after evaluation completion.
-- 2. All derived fields (percentage, rank, pass_fail) are materialized at computation time.
-- 3. result_status tracks lifecycle: PENDING → EVALUATING → PUBLISHED / WITHHELD.
-- 4. Rank is computed per exam and can be refreshed without history loss.
-- 5. is_final prevents accidental overwrites; re_evaluation_requested tracks disputes.
-- 6. percentile for NEET-style percentile computation (not just percentage).
-- 7. ai_evaluation_metadata reserved for future AI-driven mistake analysis.
-- 8. For historical re-evaluation, see exam_result_history (06.08).
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Result Context
    exam_id UUID NOT NULL,
    attempt_id UUID NOT NULL,
    student_enrollment_id UUID NOT NULL,

    -- Result Status
    result_status result_status_enum NOT NULL DEFAULT 'PENDING',

    -- Scoring Summary
    total_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    obtained_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    wrong INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    percentile DECIMAL(5,2),
    rank INTEGER,

    -- Pass/Fail
    passing_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    pass_fail BOOLEAN,

    -- Grade
    grade VARCHAR(10),

    -- Finalization & Re-evaluation
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    re_evaluation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    re_evaluated_at TIMESTAMP WITH TIME ZONE,
    re_evaluated_by UUID,

    -- AI Evaluation Metadata (future)
    ai_evaluation_metadata JSONB,

    -- Tamper Detection
    result_hash VARCHAR(64),

    -- Publishing
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_results_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_results_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_results_attempt FOREIGN KEY (tenant_id, attempt_id)
        REFERENCES public.exam_attempts(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_results_enrollment FOREIGN KEY (tenant_id, student_enrollment_id)
        REFERENCES public.student_batch_enrollments(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_results_published_by FOREIGN KEY (published_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_results_re_evaluated_by FOREIGN KEY (re_evaluated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_results_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_results_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_results_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Business Rules
    CONSTRAINT chk_result_marks CHECK (total_marks >= obtained_marks AND total_marks > 0),
    CONSTRAINT chk_result_counts CHECK (correct >= 0 AND wrong >= 0 AND skipped >= 0),
    CONSTRAINT chk_result_percentage CHECK (percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_result_percentile CHECK (percentile IS NULL OR percentile BETWEEN 0 AND 100),
    CONSTRAINT chk_result_rank CHECK (rank IS NULL OR rank > 0),
    CONSTRAINT chk_result_publishing CHECK (
        (result_status NOT IN ('PUBLISHED', 'WITHHELD') AND published_by IS NULL AND published_at IS NULL)
        OR (result_status IN ('PUBLISHED', 'WITHHELD') AND published_by IS NOT NULL AND published_at IS NOT NULL)
    ),
    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exam_results_tenant_id UNIQUE (tenant_id, id),

    CONSTRAINT chk_result_version CHECK (version > 0),

    -- Unique: One result per attempt
    CONSTRAINT uq_exam_result UNIQUE (exam_id, attempt_id)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_results_tenant_id') THEN
        ALTER TABLE public.exam_results ADD CONSTRAINT uq_exam_results_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON public.exam_results(exam_id, result_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_results_enrollment ON public.exam_results(student_enrollment_id, exam_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_results_rank ON public.exam_results(exam_id, rank) WHERE rank IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_results_tenant ON public.exam_results(tenant_id, exam_id, result_status) WHERE deleted_at IS NULL;

-- 4. Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_exam_result_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    exam_tenant UUID;
    attempt_tenant UUID;
    enrollment_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT exam_tenant
    FROM public.exams WHERE id = NEW.exam_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT attempt_tenant
    FROM public.exam_attempts WHERE id = NEW.attempt_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT enrollment_tenant
    FROM public.student_batch_enrollments WHERE id = NEW.student_enrollment_id AND deleted_at IS NULL;

    IF exam_tenant <> NEW.tenant_id OR attempt_tenant <> NEW.tenant_id OR enrollment_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across exam, attempt, enrollment, and result';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated exam, attempt, or enrollment does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_result_tenant_validation ON public.exam_results;
CREATE TRIGGER trg_biu_exam_result_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exam_results
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_result_tenant();

-- 4.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_results_touch_audit ON public.exam_results;
CREATE TRIGGER trg_bu_exam_results_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_results
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 5. RLS
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_results_select ON public.exam_results;
CREATE POLICY policy_exam_results_select
    ON public.exam_results FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                      AND user_type IN ('STAFF'::user_type_enum, 'TUTOR'::user_type_enum)
                      AND deleted_at IS NULL
                )
            )
            OR EXISTS (
                SELECT 1 FROM public.student_batch_enrollments sbe
                WHERE sbe.id = exam_results.student_enrollment_id
                  AND sbe.student_profile_id = auth.uid()
                  AND sbe.deleted_at IS NULL
            )
            OR EXISTS (
                SELECT 1 FROM public.student_batch_enrollments sbe
                JOIN public.student_parents sp ON sp.student_profile_id = sbe.student_profile_id
                WHERE sbe.id = exam_results.student_enrollment_id
                  AND sp.parent_profile_id = auth.uid()
                  AND sbe.deleted_at IS NULL
            )
        )
    );

COMMENT ON TABLE public.exam_results IS 'Computed exam results — one row per student per exam';
COMMENT ON COLUMN public.exam_results.result_status IS 'Lifecycle: PENDING, EVALUATING, PUBLISHED, WITHHELD, RE_EVALUATED';
COMMENT ON COLUMN public.exam_results.rank IS 'Computed rank within exam — can be refreshed via batch job';
COMMENT ON COLUMN public.exam_results.percentile IS 'NEET-style percentile score (0-100)';
COMMENT ON COLUMN public.exam_results.grade IS 'Letter grade (A+, A, B, C, D, F) if applicable';
COMMENT ON COLUMN public.exam_results.is_final IS 'When true, result is locked against accidental overwrites';
COMMENT ON COLUMN public.exam_results.re_evaluation_requested IS 'Flag for dispute/re-evaluation workflow';
COMMENT ON COLUMN public.exam_results.re_evaluated_at IS 'Timestamp of last re-evaluation';
COMMENT ON COLUMN public.exam_results.ai_evaluation_metadata IS 'JSONB: future AI-driven mistake analysis, difficulty feedback, topic insights';
COMMENT ON COLUMN public.exam_results.version IS 'Optimistic concurrency control version stamp';
