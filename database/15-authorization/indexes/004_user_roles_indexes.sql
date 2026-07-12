-- ============================================================================
-- File       : 004_user_roles_indexes.sql
-- Module     : Authorization
-- Purpose    : Optimization indexes for user_roles mapping checks.
-- Depends On : user_roles
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Index optimized for quick verification of active temporal roles
CREATE INDEX IF NOT EXISTS idx_user_roles_active_lookup
    ON user_roles (tenant_id, user_id, effective_from, effective_to)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON INDEX idx_user_roles_active_lookup IS 'Optimizes user login capability extraction, matching current timestamps against active assignments.';
