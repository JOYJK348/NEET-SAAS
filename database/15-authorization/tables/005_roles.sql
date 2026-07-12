-- ============================================================================
-- File       : 005_roles.sql
-- Module     : Authorization
-- Purpose    : Defines static system roles and dynamic tenant custom roles.
-- Depends On : institutes
-- Author     : Agaran Platform
-- Version    : 1.0.5
-- ============================================================================

DROP TABLE IF EXISTS roles CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Business Columns
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    role_type VARCHAR(30) DEFAULT 'CUSTOM' NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    is_editable BOOLEAN DEFAULT TRUE NOT NULL,
    is_deletable BOOLEAN DEFAULT TRUE NOT NULL,
    priority INT DEFAULT 1 NOT NULL,
    
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
ALTER TABLE roles ADD CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, code);

ALTER TABLE roles ADD CONSTRAINT chk_roles_system_protected 
    CHECK (NOT (role_type = 'SYSTEM' AND (is_deletable = TRUE OR is_editable = TRUE)));

ALTER TABLE roles ADD CONSTRAINT chk_roles_priority CHECK (priority >= 0);

ALTER TABLE roles ADD CONSTRAINT chk_roles_role_type CHECK (role_type IN ('SYSTEM', 'CUSTOM'));

ALTER TABLE roles ADD CONSTRAINT chk_roles_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_roles_tenant_lookup
    ON roles (tenant_id, priority)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE roles IS 'SaaS dynamic roles configurations mapping static permission sets.';
COMMENT ON COLUMN roles.role_type IS 'Platform configuration classification: SYSTEM defaults are immutable.';
COMMENT ON COLUMN roles.is_default IS 'True if this role is automatically assigned to new signups of a specific class.';
COMMENT ON COLUMN roles.priority IS 'Rank used to determine administrative precedence (Higher integer value matches higher power/override permissions).';
