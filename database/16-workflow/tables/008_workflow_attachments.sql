-- ============================================================================
-- File       : 008_workflow_attachments.sql
-- Module     : Workflow
-- Purpose    : Workflow attachments/supporting documents reference table.
-- Depends On : workflow_requests
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_attachments CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    
    file_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    size INT NOT NULL,
    
    uploaded_by UUID NOT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    version INT NOT NULL DEFAULT 1,
    metadata JSONB,
    
    -- Inline constraints & validations
    CONSTRAINT chk_workflow_attachments_file CHECK (length(trim(file_name)) > 0 AND length(trim(storage_key)) > 0),
    CONSTRAINT chk_workflow_attachments_size CHECK (size >= 0),
    CONSTRAINT chk_workflow_attachments_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_attachments_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX idx_workflow_attachments_lookup 
    ON workflow_attachments (tenant_id, request_id) 
    WHERE deleted_at IS NULL;

-- 3. Comments
COMMENT ON TABLE workflow_attachments IS 'Pointers linking supporting documents (PDF files, screenshots, audit logs) to workflow review transactions.';
COMMENT ON COLUMN workflow_attachments.storage_key IS 'Unique file storage bucket reference pointer (e.g. Supabase Storage / Cloudflare R2 path).';
COMMENT ON COLUMN workflow_attachments.size IS 'Size of file payload in bytes.';
