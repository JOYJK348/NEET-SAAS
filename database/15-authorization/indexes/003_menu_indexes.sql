-- ============================================================================
-- File       : 003_menu_indexes.sql
-- Module     : Authorization
-- Purpose    : Optimization indexes for menu_master tree loading queries.
-- Depends On : menu_master
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Optimizes nested sidebar tree loading
CREATE INDEX IF NOT EXISTS idx_menu_master_tenant_hierarchy
    ON menu_master (tenant_id, menu_group_id, parent_menu_id, display_order)
    WHERE deleted_at IS NULL;

-- 2. Optimizes page type visibility filters
CREATE INDEX IF NOT EXISTS idx_menu_master_page_type
    ON menu_master (tenant_id, page_type)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON INDEX idx_menu_master_tenant_hierarchy IS 'Enables nested dynamic tree navigation structures to compile on sidebars with sub-millisecond lookups.';
