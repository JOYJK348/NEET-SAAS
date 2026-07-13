-- ============================================================================
-- File       : 003_permission_groups.sql
-- Module     : Authorization
-- Purpose    : Groups permissions into visual buckets (e.g. Admissions, Academics).
-- Depends On : institutes
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

DROP TABLE IF EXISTS permission_groups CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Business Columns
    code VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 1 NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    
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
ALTER TABLE permission_groups ADD CONSTRAINT uq_permission_groups_tenant_code UNIQUE (tenant_id, code);

ALTER TABLE permission_groups ADD CONSTRAINT chk_permission_groups_display_order CHECK (display_order > 0);

ALTER TABLE permission_groups ADD CONSTRAINT chk_permission_groups_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_permission_groups_tenant_order
    ON permission_groups (tenant_id, display_order)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE permission_groups IS 'Visual group containers used to categorize granular permissions on the Role Builder UI.';
