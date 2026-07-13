-- ============================================================================
-- File       : 009_role_templates.sql
-- Module     : Authorization
-- Purpose    : Pre-configured role templates used to bootstrap new tenants.
-- Depends On : permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

DROP TABLE IF EXISTS role_templates CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Business Columns
    role_code VARCHAR(100) NOT NULL,
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
ALTER TABLE role_templates ADD CONSTRAINT uq_role_templates_mapping UNIQUE (tenant_id, role_code, permission_id);

ALTER TABLE role_templates ADD CONSTRAINT chk_role_templates_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_role_templates_lookup
    ON role_templates (tenant_id, role_code)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE role_templates IS 'Reference templates defining default capability scopes for bootstrapping standard roles.';
COMMENT ON COLUMN role_templates.permission_id IS 'Foreign key reference to permissions catalog (enforces DB integrity on template seeds).';
