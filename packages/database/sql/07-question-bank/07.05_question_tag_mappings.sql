-- ============================================================================
-- SQL File: 07.05_question_tag_mappings.sql
-- Domain: Question-Tag Bridge (Many-to-Many)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table enabling many-to-many relationship between questions and tags.
-- 2. Composite FK ensures both question and tag belong to the same tenant.
-- 3. UNIQUE (question_id, tag_id) prevents duplicate tag assignments.
-- 4. Cascade deletes with both parent tables.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_tag_mappings (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    question_id UUID NOT NULL,
    tag_id UUID NOT NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_tag_mappings_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_tag_mappings_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_question_tag_mappings_tag FOREIGN KEY (tenant_id, tag_id)
        REFERENCES public.question_tags(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_question_tag_mappings_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_tag_mappings_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_tag_mappings_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_tag_mappings_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_tag_mapping_version CHECK (version > 0),

    -- One tag per question once
    CONSTRAINT uq_question_tag_mapping UNIQUE (question_id, tag_id)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_tag_mappings_tenant_id') THEN
        ALTER TABLE public.question_tag_mappings ADD CONSTRAINT uq_question_tag_mappings_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_tag_mappings_question ON public.question_tag_mappings(question_id, tag_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_tag_mappings_tag ON public.question_tag_mappings(tag_id, question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_tag_mappings_tenant ON public.question_tag_mappings(tenant_id, question_id) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_tag_mappings_touch_audit ON public.question_tag_mappings;
CREATE TRIGGER trg_bu_question_tag_mappings_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_tag_mappings
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_tag_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_tag_mappings_select ON public.question_tag_mappings;
CREATE POLICY policy_question_tag_mappings_select
    ON public.question_tag_mappings FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_tag_mappings IS 'Many-to-many bridge between questions and tags for analytics and filtering';
COMMENT ON COLUMN public.question_tag_mappings.version IS 'Optimistic concurrency control version stamp';
