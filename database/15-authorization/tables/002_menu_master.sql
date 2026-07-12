-- ============================================================================
-- File       : 002_menu_master.sql
-- Module     : Authorization
-- Purpose    : Master list of sub-menus, detail pages, routes, and flags.
-- Depends On : menu_groups, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.4
-- ============================================================================

DROP TABLE IF EXISTS menu_master CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DDL (Table Creation)
-- ----------------------------------------------------------------------------
CREATE TABLE menu_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    menu_group_id UUID REFERENCES menu_groups(id) ON DELETE RESTRICT,
    parent_menu_id UUID REFERENCES menu_master(id) ON DELETE RESTRICT,
    
    -- Business Columns
    menu_code VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    route VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    display_order INT DEFAULT 1 NOT NULL,
    feature_id VARCHAR(50),
    module VARCHAR(50) NOT NULL,
    page_type VARCHAR(30) DEFAULT 'PAGE' NOT NULL,
    
    -- Visibility & Settings flags
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    license_key VARCHAR(50),
    feature_flag_key VARCHAR(50),
    cache_key VARCHAR(100),
    
    -- Workflow / Approval Engine integration parameters
    workflow_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    workflow_key VARCHAR(100),
    
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
ALTER TABLE menu_master ADD CONSTRAINT uq_menu_master_tenant_code UNIQUE (tenant_id, menu_code);

ALTER TABLE menu_master ADD CONSTRAINT chk_menu_master_parent_recursive CHECK (id <> parent_menu_id);

ALTER TABLE menu_master ADD CONSTRAINT chk_menu_master_display_order CHECK (display_order > 0);

ALTER TABLE menu_master ADD CONSTRAINT chk_menu_master_page_type CHECK (page_type IN ('MENU', 'PAGE', 'ACTION', 'HIDDEN'));

ALTER TABLE menu_master ADD CONSTRAINT chk_menu_master_metadata_object CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_menu_master_tenant_hierarchy
    ON menu_master (tenant_id, menu_group_id, parent_menu_id, display_order)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE menu_master IS 'SaaS dynamic sidebar navigation routing registry.';
COMMENT ON COLUMN menu_master.feature_id IS 'Maps to the inventory feature ID code (e.g. ADM-STU-001).';
COMMENT ON COLUMN menu_master.page_type IS 'Instructs UI renderer: ACTION pages must be excluded from sidebars and resolved as deep-links.';
COMMENT ON COLUMN menu_master.workflow_enabled IS 'Flag indicating if edits to pages under this menu trigger workflows.';
COMMENT ON COLUMN menu_master.workflow_key IS 'Identifies the target state machine rule set to invoke for this page.';
COMMENT ON COLUMN menu_master.cache_key IS 'Unique key string used to store/evict navigation mappings in Redis.';
