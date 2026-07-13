-- ============================================================================
-- SQL File: 14.03_storage_objects.sql
-- Domain: Storage File Registry (Storage Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Central catalog tracking all files uploaded across any module (avoids scattering paths).
-- 2. Embeds sizing bounds, mime check validation formats.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.storage_objects (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    bucket_name VARCHAR(100) NOT NULL, -- e.g. documents, recordings, profile_photos
    file_path VARCHAR(500) NOT NULL,
    
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    md5_checksum VARCHAR(32) NULL,
    
    -- Security scans status
    virus_scan_passed BOOLEAN NOT NULL DEFAULT true,
    
    owner_user_id UUID NULL, -- References public.users.id
    is_public BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_so_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_so_owner FOREIGN KEY (owner_user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_so_bucket CHECK (length(trim(bucket_name)) > 0),
    CONSTRAINT chk_so_path CHECK (length(trim(file_path)) > 0),
    CONSTRAINT chk_so_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_so_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate file paths inside the same bucket per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_so_bucket_path
    ON public.storage_objects(tenant_id, bucket_name, file_path)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.storage_objects DROP CONSTRAINT IF EXISTS uq_storage_objects_tenant_id CASCADE;
ALTER TABLE public.storage_objects ADD CONSTRAINT uq_storage_objects_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_storage_objects_touch_audit ON public.storage_objects;
CREATE TRIGGER trg_biu_storage_objects_touch_audit
    BEFORE INSERT OR UPDATE ON public.storage_objects
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_storage_objects_policy ON public.storage_objects
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_storage_objects_policy ON public.storage_objects
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_storage_objects_policy ON public.storage_objects
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_storage_objects_policy ON public.storage_objects
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
