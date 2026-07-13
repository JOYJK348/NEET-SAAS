-- ============================================================================
-- SQL File: 08.09_material_discussions.sql
-- Domain: Material Discussion / Q&A Forum
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Threaded discussions per material — supports questions, replies,
--    teacher answers, and resolution tracking.
-- 2. Self-referencing parent_comment_id for nested replies (StackOverflow style).
-- 3. resolved flag for marking answers as accepted.
-- 4. top-level comments have parent_comment_id IS NULL.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.material_discussions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    material_id UUID NOT NULL,
    parent_comment_id UUID,
    author_id UUID NOT NULL,
    comment TEXT NOT NULL,
    status discussion_status_enum NOT NULL DEFAULT 'OPEN',

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
    CONSTRAINT fk_md_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_md_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_md_parent FOREIGN KEY (parent_comment_id)
        REFERENCES public.material_discussions(id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_md_author FOREIGN KEY (author_id)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_md_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_md_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_md_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_md_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_md_comment CHECK (length(trim(comment)) > 0),
    CONSTRAINT chk_md_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_md_tenant_id') THEN
        ALTER TABLE public.material_discussions ADD CONSTRAINT uq_md_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_md_material ON public.material_discussions(material_id, parent_comment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_md_author ON public.material_discussions(author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_md_tenant ON public.material_discussions(tenant_id, material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_md_status ON public.material_discussions(material_id, status) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_md_touch_audit ON public.material_discussions;
CREATE TRIGGER trg_bu_md_touch_audit
    BEFORE INSERT OR UPDATE ON public.material_discussions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.material_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_md_select ON public.material_discussions;
CREATE POLICY policy_md_select
    ON public.material_discussions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_md_insert ON public.material_discussions;
CREATE POLICY policy_md_insert
    ON public.material_discussions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_md_update ON public.material_discussions;
CREATE POLICY policy_md_update
    ON public.material_discussions FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.material_discussions IS 'Threaded discussion forum per learning material — supports Q&A, teacher replies, and resolution tracking';
COMMENT ON COLUMN public.material_discussions.parent_comment_id IS 'Self-referencing FK for threaded replies. NULL for top-level comments.';
COMMENT ON COLUMN public.material_discussions.author_id IS 'User who authored the comment (student, teacher, or faculty)';
COMMENT ON COLUMN public.material_discussions.comment IS 'Discussion comment content';
COMMENT ON COLUMN public.material_discussions.status IS 'Thread status: OPEN, RESOLVED, CLOSED';
COMMENT ON COLUMN public.material_discussions.version IS 'Optimistic concurrency control version stamp';
