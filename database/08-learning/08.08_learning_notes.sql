-- ============================================================================
-- SQL File: 08.08_learning_notes.sql
-- Domain: Student Private Learning Notes
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Private notes for students — rich text / markdown content.
-- 2. ai_summary reserved for future AI-powered note summarization.
-- 3. Supports page and timestamp references for context.
-- 4. highlight stores selected text from the material.
-- 5. Strictly private — only the owning student can access.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.learning_notes (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    student_id UUID NOT NULL,
    material_id UUID NOT NULL,
    content TEXT NOT NULL,
    highlight TEXT,
    page_number INTEGER,
    video_timestamp INTEGER,
    ai_summary TEXT,

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
    CONSTRAINT fk_ln_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_ln_student FOREIGN KEY (student_id)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_ln_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_ln_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ln_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ln_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_ln_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_ln_content CHECK (length(trim(content)) > 0),
    CONSTRAINT chk_ln_page CHECK (page_number IS NULL OR page_number >= 0),
    CONSTRAINT chk_ln_timestamp CHECK (video_timestamp IS NULL OR video_timestamp >= 0),
    CONSTRAINT chk_ln_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_ln_tenant_id') THEN
        ALTER TABLE public.learning_notes ADD CONSTRAINT uq_ln_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ln_student ON public.learning_notes(student_id, material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ln_material ON public.learning_notes(material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ln_tenant ON public.learning_notes(tenant_id, student_id) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_ln_touch_audit ON public.learning_notes;
CREATE TRIGGER trg_bu_ln_touch_audit
    BEFORE INSERT OR UPDATE ON public.learning_notes
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.learning_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_ln_select ON public.learning_notes;
CREATE POLICY policy_ln_select
    ON public.learning_notes FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id() AND student_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS policy_ln_insert ON public.learning_notes;
CREATE POLICY policy_ln_insert
    ON public.learning_notes FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_ln_update ON public.learning_notes;
CREATE POLICY policy_ln_update
    ON public.learning_notes FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.learning_notes IS 'Student private learning notes — rich text / markdown with page and timestamp references. Only the owning student can read.';
COMMENT ON COLUMN public.learning_notes.content IS 'Note content (supports rich text / markdown)';
COMMENT ON COLUMN public.learning_notes.highlight IS 'Highlighted text from the material being noted';
COMMENT ON COLUMN public.learning_notes.page_number IS 'Referenced page number within the material';
COMMENT ON COLUMN public.learning_notes.video_timestamp IS 'Referenced video position in seconds';
COMMENT ON COLUMN public.learning_notes.ai_summary IS 'AI-generated summary of the note (future feature)';
COMMENT ON COLUMN public.learning_notes.version IS 'Optimistic concurrency control version stamp';
