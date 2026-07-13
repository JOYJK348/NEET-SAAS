-- ============================================================================
-- SQL File: 07.07_question_attachments.sql
-- Domain: Question Attachments (Images, Diagrams, PDFs, Audio, Video)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Uses storage_object_id to abstract file storage (S3/R2/Local) — never raw URLs.
-- 2. attachment_type classifies the asset for UI rendering (image vs video vs formula).
-- 3. Multiple attachments per question with display_order for sequencing.
-- 4. FK to storage_objects deferred until storage bounded context is introduced.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_attachments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    question_id UUID NOT NULL,

    storage_object_id UUID NOT NULL,
    attachment_type attachment_type_enum NOT NULL DEFAULT 'IMAGE',
    display_order INTEGER NOT NULL DEFAULT 1,
    caption TEXT,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_attachments_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_attachments_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    -- FK to storage_objects(id) — deferred until storage bounded context is created

    CONSTRAINT fk_question_attachments_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_attachments_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_attachments_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_attachments_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_attachment_order CHECK (display_order > 0),
    CONSTRAINT chk_attachment_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_attachments_tenant_id') THEN
        ALTER TABLE public.question_attachments ADD CONSTRAINT uq_question_attachments_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_attachments_question ON public.question_attachments(question_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_attachments_tenant ON public.question_attachments(tenant_id, question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_attachments_storage ON public.question_attachments(storage_object_id) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_attachments_touch_audit ON public.question_attachments;
CREATE TRIGGER trg_bu_question_attachments_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_attachments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_attachments_select ON public.question_attachments;
CREATE POLICY policy_question_attachments_select
    ON public.question_attachments FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_attachments IS 'Question attachments — images, diagrams, PDFs, audio, video files';
COMMENT ON COLUMN public.question_attachments.storage_object_id IS 'References storage_objects.id — file storage abstraction layer (not raw URL)';
COMMENT ON COLUMN public.question_attachments.attachment_type IS 'Asset type: IMAGE, DIAGRAM, PDF, AUDIO, VIDEO, FORMULA';
COMMENT ON COLUMN public.question_attachments.caption IS 'Optional caption or alt text for the attachment';
COMMENT ON COLUMN public.question_attachments.version IS 'Optimistic concurrency control version stamp';
