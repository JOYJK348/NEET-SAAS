-- ============================================================================
-- SQL File: 07.04_question_tags.sql
-- Domain: Question Tag Master Data
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Master tag registry — tags are reusable across questions (many-to-many via 07.05).
-- 2. tag_type classifies tags for AI analytics, filtering, and reporting.
-- 3. color supports UI tag badges.
-- 4. Tenant-scoped — each institute manages its own tag taxonomy.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_tags (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    tag_name VARCHAR(100) NOT NULL,
    tag_type tag_type_enum NOT NULL DEFAULT 'CUSTOM',
    color VARCHAR(7),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_tags_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_tags_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_tags_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_tags_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_tags_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_tag_name CHECK (length(trim(tag_name)) > 0),
    CONSTRAINT chk_tag_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT chk_tag_version CHECK (version > 0),

    -- Unique tag name within tenant
    CONSTRAINT uq_question_tag_name UNIQUE (tenant_id, tag_name)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_tags_tenant_id') THEN
        ALTER TABLE public.question_tags ADD CONSTRAINT uq_question_tags_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_tags_tenant_type ON public.question_tags(tenant_id, tag_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_tags_tenant_active ON public.question_tags(tenant_id, status) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_tags_touch_audit ON public.question_tags;
CREATE TRIGGER trg_bu_question_tags_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_tags
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_tags_select ON public.question_tags;
CREATE POLICY policy_question_tags_select
    ON public.question_tags FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_tags IS 'Master tag registry — reusable across questions (many-to-many via 07.05)';
COMMENT ON COLUMN public.question_tags.tag_name IS 'Display name for the tag (e.g. Organic, NCERT, PYQ, High Weightage)';
COMMENT ON COLUMN public.question_tags.tag_type IS 'Classification: TOPIC, CHAPTER, DIFFICULTY, EXAM_TYPE, FREQUENCY, SOURCE, CUSTOM';
COMMENT ON COLUMN public.question_tags.color IS 'Hex color code for UI badge display (#FF5733)';
COMMENT ON COLUMN public.question_tags.version IS 'Optimistic concurrency control version stamp';
