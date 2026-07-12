-- ============================================================================
-- File       : 013_permission_conditions.sql
-- Module     : Authorization
-- Purpose    : Maps attributes constraints rules (ABAC) to role permissions.
-- Depends On : role_permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

DROP TABLE IF EXISTS permission_conditions CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE permission_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_permission_id UUID NOT NULL REFERENCES role_permissions(id) ON DELETE CASCADE,
    
    -- Business Columns
    condition_type VARCHAR(50) NOT NULL,
    condition_rule JSONB NOT NULL,
    
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
ALTER TABLE permission_conditions ADD CONSTRAINT uq_permission_conditions_mapping UNIQUE (tenant_id, role_permission_id, condition_type);

ALTER TABLE permission_conditions ADD CONSTRAINT chk_permission_conditions_rule_object CHECK (jsonb_typeof(condition_rule) = 'object');

ALTER TABLE permission_conditions ADD CONSTRAINT chk_permission_conditions_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_permission_conditions_lookup
    ON permission_conditions (tenant_id, role_permission_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE permission_conditions IS 'ABAC (Attribute-Based Access Control) rule mapper linking specific validation logic parameters to role permissions.';
COMMENT ON COLUMN permission_conditions.condition_type IS 'Specifies constraint logic parser context (e.g. BRANCH_OWNERSHIP resolves if user branch matches record branch).';
COMMENT ON COLUMN permission_conditions.condition_rule IS 'JSON expression configuration resolving matching row columns parameters.';
