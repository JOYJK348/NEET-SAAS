-- ============================================================================
-- SQL File: 08.03_material_attachments.sql
-- Domain: Material Attachments (Files, Videos, Images, Documents)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Every file associated with learning material goes here — never store
--    file URLs directly in the learning_materials table.
-- 2. Supports one material having multiple attachments:
--    one lesson → 10 videos → 20 PDFs → images → slides
-- 3. Uses storage_object_id to abstract file storage (S3/R2/Local) — never raw URLs.
-- 4. attachment_type classifies the asset for UI rendering.
-- 5. FK to storage_objects deferred until storage bounded context is introduced.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.material_attachments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    material_id UUID NOT NULL,

    storage_object_id UUID NOT NULL,
    attachment_type learning_attachment_type_enum NOT NULL DEFAULT 'PDF',
    display_order INTEGER NOT NULL DEFAULT 1,
    duration INTEGER,
    file_size BIGINT,
    mime_type VARCHAR(100),
    caption TEXT,

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
    CONSTRAINT fk_material_attachments_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_material_attachments_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    -- FK to storage_objects(id) — deferred until storage bounded context is created

    CONSTRAINT fk_material_attachments_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_material_attachments_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_material_attachments_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_material_attachments_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_attachment_display_order CHECK (display_order > 0),
    CONSTRAINT chk_attachment_duration CHECK (duration IS NULL OR duration >= 0),
    CONSTRAINT chk_attachment_file_size CHECK (file_size IS NULL OR file_size >= 0),
    CONSTRAINT chk_attachment_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_material_attachments_tenant_id') THEN
        ALTER TABLE public.material_attachments ADD CONSTRAINT uq_material_attachments_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ma_material ON public.material_attachments(material_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ma_tenant ON public.material_attachments(tenant_id, material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ma_storage ON public.material_attachments(storage_object_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ma_type ON public.material_attachments(tenant_id, attachment_type) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_material_attachments_touch_audit ON public.material_attachments;
CREATE TRIGGER trg_bu_material_attachments_touch_audit
    BEFORE INSERT OR UPDATE ON public.material_attachments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.material_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_ma_select ON public.material_attachments;
CREATE POLICY policy_ma_select
    ON public.material_attachments FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_ma_insert ON public.material_attachments;
CREATE POLICY policy_ma_insert
    ON public.material_attachments FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_ma_update ON public.material_attachments;
CREATE POLICY policy_ma_update
    ON public.material_attachments FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.material_attachments IS 'File attachments for learning materials — one material can have multiple attachments (videos, PDFs, images, slides)';
COMMENT ON COLUMN public.material_attachments.storage_object_id IS 'References storage_objects.id — file storage abstraction layer (not raw URL)';
COMMENT ON COLUMN public.material_attachments.attachment_type IS 'Asset type: VIDEO, PDF, DOC, PPT, ZIP, IMAGE, SVG, AUDIO, SUBTITLE, THUMBNAIL, SLIDE';
COMMENT ON COLUMN public.material_attachments.duration IS 'Duration in seconds (for video/audio attachments)';
COMMENT ON COLUMN public.material_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.material_attachments.mime_type IS 'MIME type of the file (e.g. application/pdf, video/mp4)';
COMMENT ON COLUMN public.material_attachments.caption IS 'Optional caption or alt text for the attachment';
COMMENT ON COLUMN public.material_attachments.version IS 'Optimistic concurrency control version stamp';
