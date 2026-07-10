-- ============================================================================
-- SQL File: 06.08_exam_result_history.sql
-- Domain: Exam Result Re-evaluation Audit Ledger (Append-Only)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Append-ONLY table — never UPDATE or DELETE rows.
-- 2. Captures old_marks → new_marks deltas with reason and changed_by.
-- 3. Provides full audit trail for re-evaluation and dispute resolution.
-- 4. result_snapshot stores the full result row at time of change for forensic audit.
-- 5. No deleted_at — records are immutable and permanent.
-- 6. No version column — not needed for append-only immutable ledger.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_result_history (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Reference to the result being changed
    result_id UUID NOT NULL,
    exam_id UUID NOT NULL,
    student_enrollment_id UUID NOT NULL,

    -- Marks Delta
    old_total_marks DECIMAL(10,2),
    old_obtained_marks DECIMAL(10,2),
    new_total_marks DECIMAL(10,2),
    new_obtained_marks DECIMAL(10,2),

    -- Change Reason
    reason TEXT NOT NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Full Snapshot at time of change
    result_snapshot JSONB,

    -- Constraints
    CONSTRAINT fk_exam_result_history_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_result_history_result FOREIGN KEY (tenant_id, result_id)
        REFERENCES public.exam_results(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_result_history_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_result_history_enrollment FOREIGN KEY (tenant_id, student_enrollment_id)
        REFERENCES public.student_batch_enrollments(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_result_history_changed_by FOREIGN KEY (changed_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exam_result_history_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_result_history_marks CHECK (
        old_total_marks IS NOT NULL
        AND old_obtained_marks IS NOT NULL
        AND new_total_marks IS NOT NULL
        AND new_obtained_marks IS NOT NULL
    ),
    CONSTRAINT chk_result_history_delta CHECK (
        new_obtained_marks <> old_obtained_marks
        OR new_total_marks <> old_total_marks
    ),
    CONSTRAINT chk_result_history_reason CHECK (length(trim(reason)) > 0)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_result_history_tenant_id') THEN
        ALTER TABLE public.exam_result_history ADD CONSTRAINT uq_exam_result_history_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_result_history_result ON public.exam_result_history(result_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_exam_result_history_exam ON public.exam_result_history(exam_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_exam_result_history_tenant ON public.exam_result_history(tenant_id, changed_at);

-- 4. RLS
ALTER TABLE public.exam_result_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_result_history_select ON public.exam_result_history;
CREATE POLICY policy_exam_result_history_select
    ON public.exam_result_history FOR SELECT TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_exam_result_history_insert ON public.exam_result_history;
CREATE POLICY policy_exam_result_history_insert
    ON public.exam_result_history FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.exam_result_history IS 'Append-only immutable audit ledger for exam result re-evaluations';
COMMENT ON COLUMN public.exam_result_history.old_obtained_marks IS 'Previous obtained marks before re-evaluation';
COMMENT ON COLUMN public.exam_result_history.new_obtained_marks IS 'New obtained marks after re-evaluation';
COMMENT ON COLUMN public.exam_result_history.reason IS 'Audit reason for the re-evaluation (e.g. OMR re-scan, question challenge)';
COMMENT ON COLUMN public.exam_result_history.result_snapshot IS 'Full JSON snapshot of exam_results row at time of change for forensic audit';
