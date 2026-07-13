-- ============================================================================
-- SQL File: 14.04_file_uploads.sql
-- Domain: File Upload Transaction Lifecycle (Storage Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures progress details for dynamic chunked multipart file uploads.
-- 2. Scopes total upload size checks, tracking execution states.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    file_name VARCHAR(250) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    upload_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, UPLOADING, COMPLETED, FAILED
    
    chunks_total INTEGER NOT NULL DEFAULT 1,
    chunks_uploaded INTEGER NOT NULL DEFAULT 0,
    
    storage_object_id UUID NULL, -- Links to final storage target when complete
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fu_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fu_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_fu_chunks CHECK (chunks_total > 0 AND chunks_uploaded >= 0 AND chunks_uploaded <= chunks_total),
    CONSTRAINT chk_fu_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fu_status ON public.file_uploads(tenant_id, upload_status) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_file_uploads_touch_audit ON public.file_uploads;
CREATE TRIGGER trg_biu_file_uploads_touch_audit
    BEFORE INSERT OR UPDATE ON public.file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_file_uploads_policy ON public.file_uploads
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_file_uploads_policy ON public.file_uploads
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_file_uploads_policy ON public.file_uploads
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_file_uploads_policy ON public.file_uploads
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Late-binding foreign keys to resolve circular load-order dependencies
ALTER TABLE public.file_uploads DROP CONSTRAINT IF EXISTS fk_fu_storage_object;
ALTER TABLE public.file_uploads ADD CONSTRAINT fk_fu_storage_object 
    FOREIGN KEY (tenant_id, storage_object_id) 
    REFERENCES public.storage_objects(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;
