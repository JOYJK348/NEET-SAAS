-- ============================================================================
-- File       : 008_role_menu_visibility.sql
-- Module     : Authorization
-- Purpose    : Maps roles to visible menu overrides in the dynamic UI sidebar.
-- Depends On : roles, menu_master, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.5
-- ============================================================================

DROP TABLE IF EXISTS role_menu_visibility CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE role_menu_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES menu_master(id) ON DELETE CASCADE,
    
    -- Business Columns
    visibility_mode VARCHAR(30) DEFAULT 'ALLOW' NOT NULL,
    
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
ALTER TABLE role_menu_visibility ADD CONSTRAINT uq_role_menu_visibility_mapping UNIQUE (tenant_id, role_id, menu_id);

ALTER TABLE role_menu_visibility ADD CONSTRAINT chk_role_menu_visibility_mode CHECK (visibility_mode IN ('ALLOW', 'DENY', 'INHERIT'));

ALTER TABLE role_menu_visibility ADD CONSTRAINT chk_role_menu_visibility_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_role_menu_visibility_lookup
    ON role_menu_visibility (tenant_id, role_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE role_menu_visibility IS 'Junction table regulating manual visibility overrides. Primary menu access is resolved dynamically via permissions, but this table allows Tenant Admins to explicitly hide/suppress a menu from a role even if the role carries the features permissions.';
COMMENT ON COLUMN role_menu_visibility.visibility_mode IS 'Instructs UI parser: DENY explicitly overrides permission capability grants to suppress menu rendering.';
