-- ============================================================================
-- SQL File: 07.10_question_import_jobs.sql
-- Domain: Bulk Question Import Jobs (Excel, CSV, AI, OCR, PDF)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Tracks bulk import lifecycle: PENDING → IN_PROGRESS → COMPLETED / FAILED.
-- 2. Stores source file metadata, row counts, and error logs.
-- 3. error_log JSONB stores per-row validation errors for debugging.
-- 4. References storage_objects for source file via storage_object_id.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_import_jobs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_bytes BIGINT,
    storage_object_id UUID,

    -- Import Configuration
    subject_id UUID,
    chapter_id UUID,
    default_difficulty question_difficulty_enum DEFAULT 'MEDIUM',
    default_language VARCHAR(10) DEFAULT 'EN',

    -- Row Tracking
    total_rows INTEGER NOT NULL DEFAULT 0,
    imported_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    skipped_rows INTEGER NOT NULL DEFAULT 0,

    -- Status
    status import_status_enum NOT NULL DEFAULT 'PENDING',
    error_log JSONB,

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_import_jobs_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_import_jobs_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_import_jobs_chapter FOREIGN KEY (tenant_id, chapter_id)
        REFERENCES public.chapters(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_import_jobs_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_import_jobs_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_import_jobs_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_import_jobs_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_import_file_name CHECK (length(trim(file_name)) > 0),
    CONSTRAINT chk_import_file_type CHECK (length(trim(file_type)) > 0),
    CONSTRAINT chk_import_row_counts CHECK (total_rows >= 0 AND imported_rows >= 0 AND failed_rows >= 0 AND skipped_rows >= 0),
    CONSTRAINT chk_import_rows_sum CHECK (total_rows = 0 OR (imported_rows + failed_rows + skipped_rows) <= total_rows),
    CONSTRAINT chk_import_timing CHECK (
        (status = 'PENDING' AND started_at IS NULL AND completed_at IS NULL)
        OR (status = 'IN_PROGRESS' AND started_at IS NOT NULL AND completed_at IS NULL)
        OR (status IN ('COMPLETED', 'FAILED', 'PARTIAL') AND started_at IS NOT NULL AND completed_at IS NOT NULL)
    ),
    CONSTRAINT chk_import_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_import_jobs_tenant_id') THEN
        ALTER TABLE public.question_import_jobs ADD CONSTRAINT uq_question_import_jobs_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_import_jobs_tenant ON public.question_import_jobs(tenant_id, status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_import_jobs_status ON public.question_import_jobs(status, started_at) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_import_jobs_touch_audit ON public.question_import_jobs;
CREATE TRIGGER trg_bu_question_import_jobs_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_import_jobs_select ON public.question_import_jobs;
CREATE POLICY policy_question_import_jobs_select
    ON public.question_import_jobs FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_import_jobs IS 'Bulk question import job tracking — supports Excel, CSV, AI, OCR, PDF imports';
COMMENT ON COLUMN public.question_import_jobs.file_type IS 'Source format: CSV, XLSX, DOCX, PDF, JSON, AI';
COMMENT ON COLUMN public.question_import_jobs.storage_object_id IS 'Reference to uploaded source file in storage';
COMMENT ON COLUMN public.question_import_jobs.error_log IS 'JSONB: per-row validation errors for debugging and reporting';
COMMENT ON COLUMN public.question_import_jobs.status IS 'Lifecycle: PENDING → IN_PROGRESS → COMPLETED / FAILED / PARTIAL';
COMMENT ON COLUMN public.question_import_jobs.version IS 'Optimistic concurrency control version stamp';
