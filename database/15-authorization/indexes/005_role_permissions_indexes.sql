-- ============================================================================
-- File       : 005_role_permissions_indexes.sql
-- Module     : Authorization
-- Purpose    : Optimization indexes for role_permissions checks.
-- Depends On : role_permissions
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Index optimized for permissions checks evaluation
CREATE INDEX IF NOT EXISTS idx_role_permissions_resolver
    ON role_permissions (tenant_id, role_id, permission_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON INDEX idx_role_permissions_resolver IS 'Optimizes user session permissions load checks inside fn_get_user_permissions helper.';
