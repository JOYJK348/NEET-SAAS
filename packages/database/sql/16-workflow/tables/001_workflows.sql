-- ============================================================================
-- File       : 001_workflows.sql
-- Module     : Workflow
-- Purpose    : Master workflow configurations definition table.
-- Depends On : institutes (via tenant_id validation)
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflows CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    workflow_code VARCHAR(50) NOT NULL,
    workflow_version INT NOT NULL DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    allow_parallel BOOLEAN NOT NULL DEFAULT false,
    allow_cancel BOOLEAN NOT NULL DEFAULT true,
    auto_complete BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
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
    CONSTRAINT uq_workflows_tenant_code_version UNIQUE (tenant_id, workflow_code, workflow_version),
    CONSTRAINT chk_workflows_code_format CHECK (workflow_code ~ '^[A-Z][A-Z0-9_]{1,49}$'),
    CONSTRAINT chk_workflows_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_workflows_version_val CHECK (workflow_version > 0),
    CONSTRAINT chk_workflows_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflows_version CHECK (version > 0)
);

-- 2. Index configurations for tenant search mappings
CREATE INDEX idx_workflows_tenant_active 
    ON workflows (tenant_id, is_active) 
    WHERE deleted_at IS NULL;

-- 3. Comments mappings
COMMENT ON TABLE workflows IS 'Master definitions of lifecycle state machine configurations.';
COMMENT ON COLUMN workflows.workflow_code IS 'Unique uppercase alphanumeric identifier key (e.g. EXAM_APPROVAL).';
COMMENT ON COLUMN workflows.workflow_version IS 'Incrementing configuration version number to support backward-compatibility migrations.';
