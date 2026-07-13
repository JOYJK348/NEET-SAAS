-- ============================================================================
-- SQL File: 06.03_exam_questions.sql
-- Domain: Exam Questions Metadata Registry
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Metadata ONLY — no question text, options, or correct answer stored here.
-- 2. Actual question content belongs to the future 07-question-bank bounded context.
-- 3. question_bank_id will reference the question bank when introduced.
-- 4. topic_tag and chapter_id enable analytics without joining the question bank.
-- 5. UNIQUE (exam_id, display_order) prevents duplicate positions within an exam.
-- 6. RLS cascades from exam isolation policies.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Parent Context
    exam_id UUID NOT NULL,
    section_id UUID,

    -- Question Reference (Future Question Bank)
    question_bank_id UUID,

    -- Display & Scoring
    display_order INTEGER NOT NULL DEFAULT 1,
    marks DECIMAL(5,2) NOT NULL DEFAULT 4.00,
    negative_marks DECIMAL(5,2) NOT NULL DEFAULT 1.00,

    -- Question Metadata (not content)
    question_type VARCHAR(50) DEFAULT 'MCQ',
    difficulty question_difficulty_enum DEFAULT 'MEDIUM',

    -- Tags for Analytics
    topic_tag VARCHAR(100),
    chapter_id UUID,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_questions_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_questions_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_exam_questions_section FOREIGN KEY (tenant_id, section_id)
        REFERENCES public.exam_sections(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_exam_questions_chapter FOREIGN KEY (tenant_id, chapter_id)
        REFERENCES public.chapters(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_questions_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_questions_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_questions_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exam_questions_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_exam_question_order CHECK (display_order > 0),
    CONSTRAINT chk_exam_question_marks CHECK (marks > 0),
    CONSTRAINT chk_exam_question_negative CHECK (negative_marks >= 0),
    CONSTRAINT chk_exam_question_type CHECK (question_type IN ('MCQ', 'MULTI_SELECT', 'TRUE_FALSE', 'MATCHING', 'NUMERICAL', 'DESCRIPTIVE')),
    CONSTRAINT chk_exam_question_version CHECK (version > 0),

    -- Unique: One question per position in exam
    CONSTRAINT uq_exam_question_order UNIQUE (exam_id, display_order)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_questions_tenant_id') THEN
        ALTER TABLE public.exam_questions ADD CONSTRAINT uq_exam_questions_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_questions_section ON public.exam_questions(section_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_questions_bank ON public.exam_questions(question_bank_id) WHERE question_bank_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_questions_topic ON public.exam_questions(tenant_id, topic_tag) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_questions_chapter ON public.exam_questions(tenant_id, chapter_id) WHERE deleted_at IS NULL;

-- 4. Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_exam_question_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    exam_tenant UUID;
    section_tenant UUID;
    chapter_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT exam_tenant
    FROM public.exams WHERE id = NEW.exam_id AND deleted_at IS NULL;

    IF exam_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between exam and question';
    END IF;

    IF NEW.section_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT section_tenant
        FROM public.exam_sections WHERE id = NEW.section_id AND deleted_at IS NULL;

        IF section_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: section tenant_id mismatch with exam question';
        END IF;
    END IF;

    IF NEW.chapter_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT chapter_tenant
        FROM public.chapters WHERE id = NEW.chapter_id AND deleted_at IS NULL;

        IF chapter_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: chapter tenant_id mismatch with exam question';
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated exam, section, or chapter does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_question_tenant_validation ON public.exam_questions;
CREATE TRIGGER trg_biu_exam_question_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exam_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_question_tenant();

-- 4.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_questions_touch_audit ON public.exam_questions;
CREATE TRIGGER trg_bu_exam_questions_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_questions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 5. RLS
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_questions_select ON public.exam_questions;
CREATE POLICY policy_exam_questions_select
    ON public.exam_questions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.exam_questions IS 'Exam question metadata — actual content belongs to future Question Bank (07)';
COMMENT ON COLUMN public.exam_questions.question_bank_id IS 'References future question_bank.questions.id — NULL until question bank context is introduced';
COMMENT ON COLUMN public.exam_questions.question_type IS 'Format: MCQ, MULTI_SELECT, TRUE_FALSE, MATCHING, NUMERICAL, DESCRIPTIVE';
COMMENT ON COLUMN public.exam_questions.difficulty IS 'Difficulty rating for AI analytics and adaptive scoring';
COMMENT ON COLUMN public.exam_questions.topic_tag IS 'Free-form topic tag for analytics (e.g. Organic, Mechanics, Thermodynamics)';
COMMENT ON COLUMN public.exam_questions.chapter_id IS 'References syllabus chapter for analytics grouping';
COMMENT ON COLUMN public.exam_questions.version IS 'Optimistic concurrency control version stamp';
