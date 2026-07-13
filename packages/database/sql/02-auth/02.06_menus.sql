-- ============================================================================
-- SQL File: 02.06_menus.sql
-- Domain: Authentication UI Navigation Menu Layout Settings
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "menus" holds global system UI navigation routing items. No "tenant_id" scope is allowed.
-- 2. Removed "ACTION" from menu_type enum, preserving only MODULE, GROUP, and MENU.
-- 3. Simplified routing column validations (only verifies route starts with "/").
-- 4. Added "show_in_sidebar" toggle to differentiate navigation sidebar items from hidden pages.
-- 5. Exposes menus dynamically via RLS. Let the authorization mapping engine (menu_permissions) decide access.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    parent_id UUID NULL, -- Self reference for multi-level hierarchy rendering
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    route VARCHAR(250) NULL,
    
    icon_key VARCHAR(100) NULL, -- Semantic identifier for icons rather than strict framework codes
    page_title VARCHAR(150) NULL,
    
    menu_type menu_node_type NOT NULL DEFAULT 'MENU',
    display_order SMALLINT NOT NULL DEFAULT 1,
    
    show_in_sidebar BOOLEAN NOT NULL DEFAULT true,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT true, -- Global system navigation layout metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    feature_flag VARCHAR(50) NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_menus_parent FOREIGN KEY (parent_id) 
        REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_menus_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_menus_code CHECK (code ~ '^[a-z0-9_-]+(\.[a-z0-9_-]+)*$'),
    CONSTRAINT chk_menus_route CHECK (route IS NULL OR route ~ '^\/[a-zA-Z0-9_#?\-\/:=]*$'),
    CONSTRAINT chk_menus_icon_key CHECK (icon_key IS NULL OR icon_key ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT chk_menus_display_order CHECK (display_order BETWEEN 1 AND 999),
    CONSTRAINT chk_menus_system_lock CHECK (is_system = true),
    CONSTRAINT chk_menus_version CHECK (version > 0),
    CONSTRAINT uq_menus_code UNIQUE (code) -- Physical constraint supporting ON CONFLICT targets
);


-- 2. Indexes for fast hierarchical rendering and order lookups
CREATE INDEX IF NOT EXISTS idx_menus_parent_display ON public.menus(parent_id, display_order) WHERE deleted_at IS NULL AND is_active = true;

-- 2.1 Partial Unique Indexes for Soft Deletes (prevents duplicate codes globally)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_menus_code 
    ON public.menus(code) 
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_menus_touch_audit ON public.menus;
CREATE TRIGGER trg_biu_menus_touch_audit
    BEFORE INSERT OR UPDATE ON public.menus
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Allows reading dynamic navigation layout definitions to any authenticated users)
DROP POLICY IF EXISTS policy_menus_select ON public.menus;
CREATE POLICY policy_menus_select
    ON public.menus
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL 
        AND is_active = true
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.menus IS 'Global UI navigation system menu routing layout definitions';
COMMENT ON COLUMN public.menus.parent_id IS 'Parent menu node identifier for sub-menu tree groupings';
COMMENT ON COLUMN public.menus.code IS 'Unique dot-segmented lowercase menu code (e.g. students, students.add)';
COMMENT ON COLUMN public.menus.menu_type IS 'Structural type of layout item (MODULE, GROUP, MENU)';
COMMENT ON COLUMN public.menus.show_in_sidebar IS 'Flag indicating if the item is displayed in sidebar navigation panels';
COMMENT ON COLUMN public.menus.icon_key IS 'Semantic icon code for frontend rendering mapping';
COMMENT ON COLUMN public.menus.version IS 'Optimistic concurrency control version stamp';
