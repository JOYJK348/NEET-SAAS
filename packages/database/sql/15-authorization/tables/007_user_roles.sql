-- ============================================================================
-- File       : 007_user_roles.sql
-- Module     : Authorization
-- Purpose    : Junction table mapping user log-ins to their assigned roles.
-- Depends On : roles, users, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

DROP TABLE IF EXISTS user_roles CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    
    -- Temporal Boundaries for Role Assignment
    effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    effective_to TIMESTAMPTZ,
    
    -- Detailed Auditing Parameters
    assigned_by UUID NOT NULL,
    assignment_reason TEXT,
    revoked_by UUID,
    revoked_reason TEXT,
    
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
ALTER TABLE user_roles ADD CONSTRAINT uq_user_roles_mapping UNIQUE (tenant_id, user_id, role_id);

ALTER TABLE user_roles ADD CONSTRAINT chk_user_roles_temporal CHECK (effective_to IS NULL OR effective_from < effective_to);

ALTER TABLE user_roles ADD CONSTRAINT chk_user_roles_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_user_roles_active_lookup
    ON user_roles (tenant_id, user_id, effective_from, effective_to)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE user_roles IS 'Pivot table mapping user accounts to roles with support for temporary/expiring privileges.';
COMMENT ON COLUMN user_roles.effective_from IS 'The timestamp from which the role privileges become active.';
COMMENT ON COLUMN user_roles.effective_to IS 'The timestamp at which the role automatically expires (NULL = infinite).';
COMMENT ON COLUMN user_roles.assigned_by IS 'Audit link to the administrator who authorized the role assignment.';
