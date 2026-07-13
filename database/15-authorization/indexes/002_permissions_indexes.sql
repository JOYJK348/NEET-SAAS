-- ============================================================================
-- File       : 002_permissions_indexes.sql
-- Module     : Authorization
-- Purpose    : Optimization indexes for permissions queries.
-- Depends On : permissions
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Index for resource and action key segment queries
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_resolver
    ON permissions (tenant_id, resource, action)
    WHERE deleted_at IS NULL AND is_deprecated = FALSE;

-- 2. Partial unique key index to protect active key registrations per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_permissions_tenant_key
    ON permissions (tenant_id, lower(trim(permission_key)))
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON INDEX idx_permissions_tenant_resolver IS 'Optimizes resource/action checks inside RLS policy parameters and backend routing middleware.';
