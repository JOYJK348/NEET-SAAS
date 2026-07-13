-- ============================================================================
-- SQL File: 07.02_question_options.sql
-- Domain: Question Options (MCQ, Multi-Correct, Assertion-Reason)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Each option is a separate row — never store options as columns in questions table.
-- 2. Supports MCQ, MULTI_CORRECT, ASSERTION_REASON with is_correct flag.
-- 3. option_label stores A, B, C, D or Assertion/Reason labels.
-- 4. attachment_id references storage_objects for diagram-based options.
-- 5. Cascade deletes with question — options have no independent lifecycle.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    question_id UUID NOT NULL,

    option_order INTEGER NOT NULL DEFAULT 1,
    option_label VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    attachment_id UUID,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_options_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_options_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_question_options_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_options_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_options_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_options_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_option_order CHECK (option_order > 0),
    CONSTRAINT chk_option_label CHECK (length(trim(option_label)) > 0),
    CONSTRAINT chk_option_text CHECK (length(trim(option_text)) > 0),
    CONSTRAINT chk_option_version CHECK (version > 0),

    -- Unique: One option per question per label
    CONSTRAINT uq_question_option_label UNIQUE (question_id, option_label)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_options_tenant_id') THEN
        ALTER TABLE public.question_options ADD CONSTRAINT uq_question_options_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id, option_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_options_tenant ON public.question_options(tenant_id, question_id) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_options_touch_audit ON public.question_options;
CREATE TRIGGER trg_bu_question_options_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_options
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_options_select ON public.question_options;
CREATE POLICY policy_question_options_select
    ON public.question_options FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_options IS 'Individual options for each question — supports MCQ, MULTI_CORRECT, ASSERTION_REASON';
COMMENT ON COLUMN public.question_options.option_label IS 'Option identifier (A, B, C, D or Assertion, Reason)';
COMMENT ON COLUMN public.question_options.attachment_id IS 'Optional reference to storage_objects for diagram/image options';
COMMENT ON COLUMN public.question_options.is_correct IS 'True if this is a correct answer — supports multi-correct questions';
COMMENT ON COLUMN public.question_options.version IS 'Optimistic concurrency control version stamp';
