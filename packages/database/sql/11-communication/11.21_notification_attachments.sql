-- ============================================================================
-- SQL File: 11.21_notification_attachments.sql
-- Domain: Outbound Message attachments registry (Shared platform integrations)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Attaches documents references (Invoices, PDFs) to queued notification messages.
-- 2. Embeds storage pointers references.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_attachments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_queue_id UUID NOT NULL,
    
    storage_object_id VARCHAR(250) NOT NULL, -- Location pointer in storage (e.g. S3/Supabase)
    file_name VARCHAR(150) NOT NULL,
    file_size_bytes INTEGER NULL,
    mime_type VARCHAR(100) NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_natt_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_natt_queue FOREIGN KEY (tenant_id, notification_queue_id)
        REFERENCES public.notification_queue(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_natt_storage CHECK (length(trim(storage_object_id)) > 0),
    CONSTRAINT chk_natt_name CHECK (length(trim(file_name)) > 0),
    CONSTRAINT chk_natt_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
    CONSTRAINT chk_natt_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_natt_queue ON public.notification_attachments(notification_queue_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_attachments_touch_audit ON public.notification_attachments;
CREATE TRIGGER trg_biu_notification_attachments_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_attachments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_attachments_policy ON public.notification_attachments
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_attachments_policy ON public.notification_attachments
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_attachments_policy ON public.notification_attachments
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_attachments_policy ON public.notification_attachments
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
