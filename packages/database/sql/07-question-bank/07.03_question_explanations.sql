-- ============================================================================
-- SQL File: 07.03_question_explanations.sql
-- Domain: Question Explanations & Solutions
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Explanation is separate from question — never mix explanation text in questions table.
-- 2. Supports multi-language explanations (English, Hindi, Tamil, etc.).
-- 3. ai_generated flag for AI explanations vs human-authored.
-- 4. verified_by tracks academic team validation.
-- 5. Multiple explanations per question (one per language) — UNIQUE(question_id, language).
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_explanations (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    question_id UUID NOT NULL,

    language VARCHAR(10) NOT NULL DEFAULT 'EN',
    solution_text TEXT NOT NULL,
    short_explanation TEXT,
    video_url VARCHAR(500),

    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_explanations_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_explanations_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_question_explanations_verified_by FOREIGN KEY (verified_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_explanations_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_explanations_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_explanations_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_explanations_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_explanation_text CHECK (length(trim(solution_text)) > 0),
    CONSTRAINT chk_explanation_video CHECK (video_url IS NULL OR length(trim(video_url)) > 0),
    CONSTRAINT chk_explanation_verification CHECK (
        (verified = false AND verified_by IS NULL AND verified_at IS NULL)
        OR (verified = true AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_explanation_version CHECK (version > 0),

    -- One explanation per language per question
    CONSTRAINT uq_question_explanation_language UNIQUE (question_id, language)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_explanations_tenant_id') THEN
        ALTER TABLE public.question_explanations ADD CONSTRAINT uq_question_explanations_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_explanations_question ON public.question_explanations(question_id, language) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_explanations_tenant ON public.question_explanations(tenant_id, question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_explanations_ai ON public.question_explanations(ai_generated, verified) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_explanations_touch_audit ON public.question_explanations;
CREATE TRIGGER trg_bu_question_explanations_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_explanations
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_explanations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_explanations_select ON public.question_explanations;
CREATE POLICY policy_question_explanations_select
    ON public.question_explanations FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_explanations IS 'Question explanations and solutions — one per language per question';
COMMENT ON COLUMN public.question_explanations.solution_text IS 'Full step-by-step solution explanation';
COMMENT ON COLUMN public.question_explanations.short_explanation IS 'Brief explanation for quick review display';
COMMENT ON COLUMN public.question_explanations.ai_generated IS 'True if generated by AI, false if human-authored';
COMMENT ON COLUMN public.question_explanations.verified IS 'True if reviewed and verified by academic team';
COMMENT ON COLUMN public.question_explanations.version IS 'Optimistic concurrency control version stamp';
