-- ============================================================================
-- SQL File: 06.06_exam_answers.sql
-- Domain: Exam Answers Registry (Largest Table)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. One row per question per attempt — UNIQUE (attempt_id, question_id).
-- 2. selected_option stores the student's chosen answer; NULL for unattempted.
-- 3. marks_awarded may differ from question marks for partial/negative marking.
-- 4. evaluation_status tracks manual re-evaluation workflow.
-- 5. answered_at enables time-per-question analytics.
-- 6. Designed for partition by (tenant_id, exam_id) at scale.
--    Partition Strategy Recommendation (future):
--    Option A: BY RANGE (exam_id) — groups all answers for an exam together.
--    Option B: BY LIST (tenant_id) — for per-tenant data isolation.
--    Option C: BY RANGE (created_at) — time-based for archival.
--    Implement after reaching 50M+ rows; monitor pg_partman for automation.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Attempt Context
    attempt_id UUID NOT NULL,
    question_id UUID NOT NULL,

    -- Student Response
    selected_option CHAR(1),
    answer_text TEXT,
    is_correct BOOLEAN,
    marks_awarded DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- Evaluation
    answer_status answer_status_enum NOT NULL DEFAULT 'UNATTEMPTED',
    evaluation_status evaluation_status_enum NOT NULL DEFAULT 'PENDING',
    evaluated_by UUID,
    evaluated_at TIMESTAMP WITH TIME ZONE,

    -- Timing
    answered_at TIMESTAMP WITH TIME ZONE,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_answers_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_answers_attempt FOREIGN KEY (tenant_id, attempt_id)
        REFERENCES public.exam_attempts(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_exam_answers_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.exam_questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_answers_evaluated_by FOREIGN KEY (evaluated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_answers_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_answers_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_answers_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Business Rules
    CONSTRAINT chk_answer_evaluation CHECK (
        (evaluation_status = 'PENDING' AND evaluated_by IS NULL AND evaluated_at IS NULL)
        OR (evaluation_status IN ('COMPLETED', 'RE_EVALUATION') AND evaluated_by IS NOT NULL AND evaluated_at IS NOT NULL)
    ),
    CONSTRAINT chk_answer_selected_option CHECK (selected_option IN ('A', 'B', 'C', 'D', 'E', NULL)),
    CONSTRAINT chk_answer_marks CHECK (marks_awarded >= 0),
    CONSTRAINT chk_answer_version CHECK (version > 0),
    CONSTRAINT chk_answer_status CHECK (
        (answer_status = 'UNATTEMPTED' AND selected_option IS NULL)
        OR (answer_status IN ('CORRECT', 'INCORRECT', 'PARTIAL') AND selected_option IS NOT NULL)
        OR (answer_status = 'FLAGGED')
    ),

    -- Unique: One answer per question per attempt
    CONSTRAINT uq_exam_answer UNIQUE (attempt_id, question_id)
);

-- 2. Critical Indexes for query performance at scale
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON public.exam_answers(attempt_id, question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_answers_tenant_attempt ON public.exam_answers(tenant_id, attempt_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_answers_question ON public.exam_answers(question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_answers_evaluation ON public.exam_answers(evaluation_status, evaluated_at) WHERE deleted_at IS NULL;

-- 3. Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_exam_answer_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    attempt_tenant UUID;
    question_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT attempt_tenant
    FROM public.exam_attempts WHERE id = NEW.attempt_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT question_tenant
    FROM public.exam_questions WHERE id = NEW.question_id AND deleted_at IS NULL;

    IF attempt_tenant <> NEW.tenant_id OR question_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across attempt, question, and answer';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated attempt or question does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_answer_tenant_validation ON public.exam_answers;
CREATE TRIGGER trg_biu_exam_answer_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exam_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_answer_tenant();

-- 3.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_answers_touch_audit ON public.exam_answers;
CREATE TRIGGER trg_bu_exam_answers_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_answers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. RLS
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_answers_select ON public.exam_answers;
CREATE POLICY policy_exam_answers_select
    ON public.exam_answers FOR SELECT TO authenticated
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
                SELECT 1 FROM public.exam_attempts ea
                JOIN public.student_admissions sa ON sa.id = ea.student_admission_id
                WHERE ea.id = exam_answers.attempt_id
                  AND sa.student_profile_id = auth.uid()
                  AND sa.deleted_at IS NULL
            )
            OR EXISTS (
                SELECT 1 FROM public.exam_attempts ea
                JOIN public.student_admissions sa ON sa.id = ea.student_admission_id
                JOIN public.student_parents sp ON sp.student_profile_id = sa.student_profile_id
                WHERE ea.id = exam_answers.attempt_id
                  AND sp.parent_profile_id = auth.uid()
                  AND sa.deleted_at IS NULL
            )
        )
    );

COMMENT ON TABLE public.exam_answers IS 'Student answers per question — largest table, partition-ready at scale';
COMMENT ON COLUMN public.exam_answers.selected_option IS 'Selected option (A, B, C, D, E) for MCQ; NULL for unattempted or non-MCQ';
COMMENT ON COLUMN public.exam_answers.answer_text IS 'Free-text answer for descriptive/numerical question types';
COMMENT ON COLUMN public.exam_answers.answer_status IS 'Classification: CORRECT, INCORRECT, PARTIAL, UNATTEMPTED, FLAGGED';
COMMENT ON COLUMN public.exam_answers.evaluation_status IS 'Evaluation workflow: PENDING, IN_PROGRESS, COMPLETED, RE_EVALUATION';
COMMENT ON COLUMN public.exam_answers.version IS 'Optimistic concurrency control version stamp';
