-- ============================================================================
-- SQL File: 06.09_exam_documents.sql
-- Domain: Exam Attachments & Documents (Answer Keys, OMR Scans, Admit Cards)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Uses storage_object_id to abstract file storage (S3/R2/Local).
-- 2. document_category classifies the document type for UI filtering.
-- 3. Tenant-scoped with composite FK to exams for referential safety.
-- 4. Supports multiple documents per exam (answer key PDF, solution PDF, OMR scans).
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_documents (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Document Context
    exam_id UUID NOT NULL,
    document_category document_category_enum NOT NULL,

    -- Document Details
    display_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Storage Reference ( abstracted — not raw URL )
    storage_object_id UUID NOT NULL,

    -- Document Type & Size
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,

    -- Visibility
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display Order
    display_order INTEGER NOT NULL DEFAULT 1,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_documents_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_documents_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    -- FK to storage_objects(id) — deferred until storage_objects table is created in future migration

    CONSTRAINT fk_exam_documents_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_documents_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_documents_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Business Rules
    CONSTRAINT chk_document_name CHECK (length(trim(display_name)) > 0),
    CONSTRAINT chk_document_order CHECK (display_order > 0),
    CONSTRAINT chk_document_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exam_documents_tenant_id UNIQUE (tenant_id, id),

    CONSTRAINT chk_document_version CHECK (version > 0)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_documents_tenant_id') THEN
        ALTER TABLE public.exam_documents ADD CONSTRAINT uq_exam_documents_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_documents_exam ON public.exam_documents(exam_id, document_category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_documents_tenant ON public.exam_documents(tenant_id, exam_id, document_category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_documents_storage ON public.exam_documents(storage_object_id) WHERE deleted_at IS NULL;

-- 4. Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_documents_touch_audit ON public.exam_documents;
CREATE TRIGGER trg_bu_exam_documents_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_documents
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 5. RLS
ALTER TABLE public.exam_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_documents_select ON public.exam_documents;
CREATE POLICY policy_exam_documents_select
    ON public.exam_documents FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
            OR (is_public = true AND is_active = true)
        )
    );

COMMENT ON TABLE public.exam_documents IS 'Exam attachments — answer keys, solution PDFs, OMR scans, admit cards, hall tickets';
COMMENT ON COLUMN public.exam_documents.document_category IS 'Enum: QUESTION_PAPER, ANSWER_KEY, OMR_SCAN, SOLUTION_PDF, ADMIT_CARD, HALL_TICKET, RESULT_SHEET, OTHER';
COMMENT ON COLUMN public.exam_documents.storage_object_id IS 'References storage_objects.id — file storage abstraction layer (not raw URL)';
COMMENT ON COLUMN public.exam_documents.is_public IS 'If true, visible to students without authentication (e.g. public answer key)';
COMMENT ON COLUMN public.exam_documents.version IS 'Optimistic concurrency control version stamp';
