-- ============================================================================
-- File       : 012_role_inheritance.sql
-- Module     : Authorization
-- Purpose    : Maps parent-child role mappings (e.g. Manager inherits Faculty).
-- Depends On : roles, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

DROP TABLE IF EXISTS role_inheritance CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE role_inheritance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    inherits_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    
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
ALTER TABLE role_inheritance ADD CONSTRAINT uq_role_inheritance_mapping UNIQUE (tenant_id, role_id, inherits_role_id);

ALTER TABLE role_inheritance ADD CONSTRAINT chk_role_inheritance_recursive CHECK (role_id <> inherits_role_id);

ALTER TABLE role_inheritance ADD CONSTRAINT chk_role_inheritance_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_role_inheritance_lookup
    ON role_inheritance (tenant_id, role_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE role_inheritance IS 'Pivot table mapping role inheritance hierarchies, preventing permission duplications across dynamic roles configurations.';
COMMENT ON COLUMN role_inheritance.role_id IS 'Foreign key reference to child/inheriting role.';
COMMENT ON COLUMN role_inheritance.inherits_role_id IS 'Foreign key reference to parent/inherited role.';
