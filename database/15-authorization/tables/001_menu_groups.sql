-- ============================================================================
-- File       : 001_menu_groups.sql
-- Module     : Authorization
-- Purpose    : Defines top-level menu groups for sidebar navigation groupings.
-- Depends On : institutes (under platform/master context)
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

DROP TABLE IF EXISTS menu_groups CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE menu_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Business Columns
    code VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(30),
    description TEXT,
    default_expanded BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INT DEFAULT 1 NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    
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
ALTER TABLE menu_groups ADD CONSTRAINT uq_menu_groups_tenant_code UNIQUE (tenant_id, code);

ALTER TABLE menu_groups ADD CONSTRAINT uq_menu_groups_tenant_slug UNIQUE (tenant_id, slug);

ALTER TABLE menu_groups ADD CONSTRAINT chk_menu_groups_display_order CHECK (display_order > 0);

ALTER TABLE menu_groups ADD CONSTRAINT chk_menu_groups_slug_format CHECK (slug ~ '^[a-z0-9\-]+$');

ALTER TABLE menu_groups ADD CONSTRAINT chk_menu_groups_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_menu_groups_tenant_order 
    ON menu_groups (tenant_id, display_order, is_visible)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE menu_groups IS 'Top-level navigation containers grouping master pages.';
COMMENT ON COLUMN menu_groups.code IS 'Alphanumeric immutable code identifier used by frontend routers.';
COMMENT ON COLUMN menu_groups.slug IS 'Lowercase route-friendly string used to build clean browser address lines.';
COMMENT ON COLUMN menu_groups.color IS 'UI color indicator mapping for dynamic theme rendering.';
