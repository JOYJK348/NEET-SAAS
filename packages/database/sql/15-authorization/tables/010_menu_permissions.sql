-- ============================================================================
-- File       : 010_menu_permissions.sql
-- Module     : Authorization
-- Purpose    : Maps navigation menu items to the permissions required to view them.
-- Depends On : menu_master, permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.3
-- ============================================================================

DROP TABLE IF EXISTS menu_permissions CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE menu_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    menu_id UUID NOT NULL REFERENCES menu_master(id) ON DELETE CASCADE,
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
ALTER TABLE menu_permissions ADD CONSTRAINT uq_menu_permissions_mapping UNIQUE (tenant_id, menu_id, permission_id);

ALTER TABLE menu_permissions ADD CONSTRAINT chk_menu_permissions_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_menu_permissions_lookup
    ON menu_permissions (tenant_id, menu_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE menu_permissions IS 'Junction table linking frontend pages/sidebar items to the permissions required to view or access them.';
COMMENT ON COLUMN menu_permissions.menu_id IS 'Foreign key reference to menu_master.';
COMMENT ON COLUMN menu_permissions.permission_id IS 'Foreign key reference to permissions catalog.';
