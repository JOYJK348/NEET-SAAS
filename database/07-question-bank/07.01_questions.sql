-- ============================================================================
-- SQL File: 07.01_questions.sql
-- Domain: Question Bank Core Aggregate Root
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "questions" is the root aggregate for the question bank bounded context.
-- 2. Stores only question metadata + question_text (the stem). Options, explanations, and attachments are separate tables.
-- 3. Immutable after publication — edits create new versions in 07.06_question_versions.
-- 4. Every question maps to subject → chapter → topic hierarchy for analytics.
-- 5. Composite FKs (tenant_id, *) enforce complete multi-tenant referential safety.
-- 6. RLS: Super Admin + Academic Admin + Faculty + Reviewer only. No student access.
-- 7. AI metadata JSONB reserved for future ML-driven difficulty prediction and taxonomy.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Academic Hierarchy
    subject_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    topic_id UUID,

    -- Question Identity
    question_code VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,

    -- Classification
    question_type question_type_enum NOT NULL DEFAULT 'MCQ',
    difficulty question_difficulty_enum NOT NULL DEFAULT 'MEDIUM',
    blooms_level blooms_level_enum,
    language VARCHAR(10) NOT NULL DEFAULT 'EN',

    -- Source & Status
    source question_source_enum NOT NULL DEFAULT 'MANUAL',
    question_status question_status_enum NOT NULL DEFAULT 'DRAFT',

    -- Versioning & Locking
    published_version INTEGER,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID,

    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,

    -- AI Metadata (future)
    ai_metadata JSONB,
    embedding_metadata JSONB,
    difficulty_prediction JSONB,
    taxonomy_metadata JSONB,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_questions_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_questions_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_questions_chapter FOREIGN KEY (tenant_id, chapter_id)
        REFERENCES public.chapters(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_questions_topic FOREIGN KEY (tenant_id, topic_id)
        REFERENCES public.topics(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_questions_approved_by FOREIGN KEY (approved_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_questions_locked_by FOREIGN KEY (locked_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_questions_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_questions_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_questions_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness (enables composite FKs)
    CONSTRAINT uq_questions_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_questions_code CHECK (length(trim(question_code)) > 0),
    CONSTRAINT chk_questions_text CHECK (length(trim(question_text)) > 0),
    CONSTRAINT chk_questions_published_version CHECK (published_version IS NULL OR published_version > 0),
    CONSTRAINT chk_questions_locked CHECK (
        (is_locked = false AND locked_by IS NULL AND locked_at IS NULL)
        OR (is_locked = true AND locked_by IS NOT NULL AND locked_at IS NOT NULL)
    ),
    CONSTRAINT chk_questions_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL)
        OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
    CONSTRAINT chk_questions_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_questions_tenant_id') THEN
        ALTER TABLE public.questions ADD CONSTRAINT uq_questions_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Unique question code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_questions_tenant_code
    ON public.questions(tenant_id, question_code)
    WHERE deleted_at IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_tenant_subject ON public.questions(tenant_id, subject_id, question_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_tenant_chapter ON public.questions(tenant_id, chapter_id, question_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_tenant_topic ON public.questions(tenant_id, topic_id) WHERE topic_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_tenant_difficulty ON public.questions(tenant_id, difficulty, question_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_tenant_status ON public.questions(tenant_id, question_status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_tenant_type ON public.questions(tenant_id, question_type, question_status) WHERE deleted_at IS NULL;

-- Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_question_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    subject_tenant UUID;
    chapter_tenant UUID;
    topic_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT subject_tenant
    FROM public.subjects WHERE id = NEW.subject_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT chapter_tenant
    FROM public.chapters WHERE id = NEW.chapter_id AND deleted_at IS NULL;

    IF subject_tenant <> NEW.tenant_id OR chapter_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across subject, chapter, and question';
    END IF;

    IF NEW.topic_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT topic_tenant
        FROM public.topics WHERE id = NEW.topic_id AND deleted_at IS NULL;

        IF topic_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: topic tenant_id mismatch with question';
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated subject, chapter, or topic does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_question_tenant_validation ON public.questions;
CREATE TRIGGER trg_biu_question_tenant_validation
    BEFORE INSERT OR UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_question_tenant();

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_questions_touch_audit ON public.questions;
CREATE TRIGGER trg_bu_questions_touch_audit
    BEFORE INSERT OR UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_questions_select ON public.questions;
CREATE POLICY policy_questions_select
    ON public.questions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                  AND user_type IN ('STAFF'::user_type_enum, 'TUTOR'::user_type_enum)
                  AND deleted_at IS NULL
            )
        )
    );

DROP POLICY IF EXISTS policy_questions_insert ON public.questions;
CREATE POLICY policy_questions_insert
    ON public.questions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_questions_update ON public.questions;
CREATE POLICY policy_questions_update
    ON public.questions FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.questions IS 'Question bank aggregate root — stores question stem and metadata only';
COMMENT ON COLUMN public.questions.question_code IS 'Unique question identifier code within tenant (e.g. PHY-MCQ-001)';
COMMENT ON COLUMN public.questions.question_text IS 'Question stem content (actual question text)';
COMMENT ON COLUMN public.questions.blooms_level IS 'Bloom''s taxonomy: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE';
COMMENT ON COLUMN public.questions.published_version IS 'Current published version — never overwrite, use 07.06_question_versions';
COMMENT ON COLUMN public.questions.ai_metadata IS 'JSONB: reserved for ML predictions, difficulty scoring, topic classification';
COMMENT ON COLUMN public.questions.embedding_metadata IS 'JSONB: vector embedding metadata for AI similarity search';
COMMENT ON COLUMN public.questions.version IS 'Optimistic concurrency control version stamp';

-- FK from question_paper_questions → questions (deferred because 06.05 runs before this file)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_qpq_question') THEN
        ALTER TABLE public.question_paper_questions ADD CONSTRAINT fk_qpq_question
            FOREIGN KEY (tenant_id, question_id)
            REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT;
    END IF;
END $$;
