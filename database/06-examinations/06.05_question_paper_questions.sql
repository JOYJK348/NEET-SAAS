-- ============================================================================
-- SQL File: 06.04_question_paper_questions.sql
-- Domain: Question Paper → Question Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table linking question papers to individual questions.
-- 2. A question can appear in multiple papers (reusable question bank).
-- 3. section field allows grouping questions within a paper
--    (e.g. "Physics", "Chemistry", "Botany", "Zoology" for NEET).
-- 4. display_order controls question sequencing within the paper.
-- 5. marks and negative_marks can be overridden per paper instance.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_paper_questions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    paper_id UUID NOT NULL,
    question_id UUID NOT NULL,

    section VARCHAR(100),
    marks DECIMAL(5,2) NOT NULL DEFAULT 4.00,
    negative_marks DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    display_order INTEGER NOT NULL DEFAULT 1,

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
    CONSTRAINT fk_qpq_paper FOREIGN KEY (tenant_id, paper_id)
        REFERENCES public.question_papers(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    -- FK fk_qpq_question added via ALTER TABLE in 07.01_questions.sql after questions exists

    CONSTRAINT fk_qpq_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_qpq_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_qpq_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_qpq_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_qpq_marks CHECK (marks > 0),
    CONSTRAINT chk_qpq_negative_marks CHECK (negative_marks >= 0),
    CONSTRAINT chk_qpq_display_order CHECK (display_order > 0),
    CONSTRAINT chk_qpq_version CHECK (version > 0),

    -- One question per paper only once
    CONSTRAINT uq_qpq_paper_question UNIQUE (paper_id, question_id),

    -- Unique display order within a paper
    CONSTRAINT uq_qpq_paper_order UNIQUE (paper_id, display_order)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_qpq_tenant_id') THEN
        ALTER TABLE public.question_paper_questions ADD CONSTRAINT uq_qpq_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qpq_paper ON public.question_paper_questions(paper_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qpq_question ON public.question_paper_questions(question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qpq_tenant ON public.question_paper_questions(tenant_id, paper_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qpq_section ON public.question_paper_questions(paper_id, section, display_order) WHERE section IS NOT NULL AND deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_qpq_touch_audit ON public.question_paper_questions;
CREATE TRIGGER trg_bu_qpq_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_paper_questions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_paper_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_qpq_select ON public.question_paper_questions;
CREATE POLICY policy_qpq_select
    ON public.question_paper_questions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_qpq_insert ON public.question_paper_questions;
CREATE POLICY policy_qpq_insert
    ON public.question_paper_questions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_qpq_update ON public.question_paper_questions;
CREATE POLICY policy_qpq_update
    ON public.question_paper_questions FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.question_paper_questions IS 'Bridge table linking question papers to questions — supports section grouping and per-paper mark overrides';
COMMENT ON COLUMN public.question_paper_questions.section IS 'Section grouping within paper (e.g. Physics, Chemistry, Botany, Zoology for NEET)';
COMMENT ON COLUMN public.question_paper_questions.marks IS 'Marks for this question in this paper (can override question default)';
COMMENT ON COLUMN public.question_paper_questions.negative_marks IS 'Negative marks for this question in this paper';
COMMENT ON COLUMN public.question_paper_questions.display_order IS 'Question sequence within the paper';
COMMENT ON COLUMN public.question_paper_questions.version IS 'Optimistic concurrency control version stamp';
