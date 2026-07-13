-- ============================================================================
-- File       : 011_permission_dependencies.sql
-- Module     : Authorization
-- Purpose    : Maps permissions to other permissions they depend on (e.g. edit requires view).
-- Depends On : permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

DROP TABLE IF EXISTS permission_dependencies CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE permission_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    requires_permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
    
    -- Common Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    version INT DEFAULT 1 NOT NULL,
    metadata JSONB
);

-- ----------------------------------------------------------------------------
-- 2. Constraints
-- ----------------------------------------------------------------------------
ALTER TABLE permission_dependencies ADD CONSTRAINT uq_permission_dependencies_mapping UNIQUE (tenant_id, permission_id, requires_permission_id);

ALTER TABLE permission_dependencies ADD CONSTRAINT chk_permission_dependencies_recursive CHECK (permission_id <> requires_permission_id);

ALTER TABLE permission_dependencies ADD CONSTRAINT chk_permission_dependencies_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_permission_dependencies_lookup
    ON permission_dependencies (tenant_id, permission_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE permission_dependencies IS 'Junction table storing capability prerequisites, preventing admins from assigning advanced actions (e.g. edit) without also assigning base requirements (e.g. view).';
COMMENT ON COLUMN permission_dependencies.permission_id IS 'Foreign key reference to target permissions.';
COMMENT ON COLUMN permission_dependencies.requires_permission_id IS 'Foreign key reference to prerequisite permissions.';
