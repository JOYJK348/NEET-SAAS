-- ============================================================================
-- File       : 004_permissions.sql
-- Module     : Authorization
-- Purpose    : Master list of granular system permissions.
-- Depends On : permission_groups, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS permissions CASCADE;

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    permission_group_id UUID REFERENCES permission_groups(id) ON DELETE RESTRICT,
    
    -- Business Columns
    permission_key VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    is_deprecated BOOLEAN DEFAULT FALSE NOT NULL,
    scope VARCHAR(30) DEFAULT 'TENANT' NOT NULL,
    
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
ALTER TABLE permissions ADD CONSTRAINT uq_permissions_tenant_key UNIQUE (tenant_id, permission_key);

ALTER TABLE permissions ADD CONSTRAINT chk_permissions_key_format CHECK (permission_key ~ '^[a-z_]+(\.[a-z_]+)+$');

ALTER TABLE permissions ADD CONSTRAINT chk_permissions_scope CHECK (scope IN ('GLOBAL', 'TENANT', 'OWNER', 'SELF'));

ALTER TABLE permissions ADD CONSTRAINT chk_permissions_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_permissions_tenant_resolver
    ON permissions (tenant_id, resource, action)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE permissions IS 'Granular capabilities catalogue used by guards and middleware routers.';
COMMENT ON COLUMN permissions.permission_key IS 'Full dot-notation string key matching: domain.(subresource).action.';
COMMENT ON COLUMN permissions.scope IS 'Evaluates RLS boundary limit rules for this capability (e.g. SELF permits only own rows).';
COMMENT ON COLUMN permissions.is_deprecated IS 'True if the capability will be removed in a future api release.';
