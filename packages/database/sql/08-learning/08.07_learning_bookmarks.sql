-- ============================================================================
-- SQL File: 08.07_learning_bookmarks.sql
-- Domain: Student Learning Bookmarks
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Students bookmark important positions within materials for quick access.
-- 2. Supports video timestamps (seconds) and PDF page numbers.
-- 3. Private to the student who created them.
-- 4. Soft-delete allows students to manage their own bookmarks.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.learning_bookmarks (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    student_id UUID NOT NULL,
    material_id UUID NOT NULL,
    page_number INTEGER,
    video_timestamp INTEGER,
    notes TEXT,

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
    CONSTRAINT fk_lb_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_lb_student FOREIGN KEY (student_id)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_lb_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_lb_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lb_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lb_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_lb_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_lb_page CHECK (page_number IS NULL OR page_number >= 0),
    CONSTRAINT chk_lb_timestamp CHECK (video_timestamp IS NULL OR video_timestamp >= 0),
    CONSTRAINT chk_lb_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_lb_tenant_id') THEN
        ALTER TABLE public.learning_bookmarks ADD CONSTRAINT uq_lb_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lb_student ON public.learning_bookmarks(student_id, material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lb_material ON public.learning_bookmarks(material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lb_tenant ON public.learning_bookmarks(tenant_id, student_id) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_lb_touch_audit ON public.learning_bookmarks;
CREATE TRIGGER trg_bu_lb_touch_audit
    BEFORE INSERT OR UPDATE ON public.learning_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.learning_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_lb_select ON public.learning_bookmarks;
CREATE POLICY policy_lb_select
    ON public.learning_bookmarks FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
            AND (
                student_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                      AND user_type IN ('STAFF'::user_type_enum, 'TUTOR'::user_type_enum)
                      AND deleted_at IS NULL
                )
            )
        )
    );

DROP POLICY IF EXISTS policy_lb_insert ON public.learning_bookmarks;
CREATE POLICY policy_lb_insert
    ON public.learning_bookmarks FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_lb_update ON public.learning_bookmarks;
CREATE POLICY policy_lb_update
    ON public.learning_bookmarks FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.learning_bookmarks IS 'Student bookmarks for quick access to specific positions within learning materials';
COMMENT ON COLUMN public.learning_bookmarks.page_number IS 'Bookmarked page number (for PDF/document materials)';
COMMENT ON COLUMN public.learning_bookmarks.video_timestamp IS 'Bookmarked video position in seconds';
COMMENT ON COLUMN public.learning_bookmarks.notes IS 'Optional student notes for why this position was bookmarked';
COMMENT ON COLUMN public.learning_bookmarks.version IS 'Optimistic concurrency control version stamp';
