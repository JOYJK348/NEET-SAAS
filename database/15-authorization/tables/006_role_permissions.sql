-- ============================================================================
-- File       : 006_role_permissions.sql
-- Module     : Authorization
-- Purpose    : Junction table mapping role scopes to granular permission keys.
-- Depends On : roles, permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

DROP TABLE IF EXISTS role_permissions CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
    
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
ALTER TABLE role_permissions ADD CONSTRAINT uq_role_permissions_mapping UNIQUE (tenant_id, role_id, permission_id);

ALTER TABLE role_permissions ADD CONSTRAINT chk_role_permissions_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_role_permissions_resolver
    ON role_permissions (tenant_id, role_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE role_permissions IS 'Pivot table mapping runtime user roles to their authorized capabilities scopes.';
