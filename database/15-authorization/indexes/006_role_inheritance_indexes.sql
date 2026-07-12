-- ============================================================================
-- File       : 006_role_inheritance_indexes.sql
-- Module     : Authorization
-- Purpose    : Optimization indexes for role_inheritance queries.
-- Depends On : role_inheritance
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Index optimized for dynamic hierarchical permissions propagation checks
CREATE INDEX IF NOT EXISTS idx_role_inheritance_resolver
    ON role_inheritance (tenant_id, role_id, inherits_role_id)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON INDEX idx_role_inheritance_resolver IS 'Enables nested CTE loops to resolve complete inherited capabilities mappings in sub-millisecond ranges.';
