-- ============================================================================
-- SQL File: 02.07_menu_permissions.sql
-- Domain: Authentication UI Navigation Menu Permissions Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "menu_permissions" functions as a pure normalized bridge table mapping menus to permissions.
-- 2. No "tenant_id" scope is allowed (both menus and permissions are global application metadata).
-- 3. Primary key is composite: PRIMARY KEY (menu_id, permission_id) to eliminate surrogate UUID overhead.
-- 4. Linked created_by UUID directly to public.users(id) with ON DELETE SET NULL.
-- 5. Exposes idx_mp_menu and idx_mp_permission indexes to optimize join queries.
-- 6. Set RLS policy permitting authenticated users read-only access (for navigation mapping calculations).
-- 7. Audits are limited to created_at and created_by (no updates/version tracking on pure inserts/deletes).
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.menu_permissions (
    menu_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    
    -- Audit Stamps (Insert/Delete only mapping, no update/version audit needed)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    
    PRIMARY KEY (menu_id, permission_id),
    
    -- Standard foreign keys referencing catalogs
    CONSTRAINT fk_mp_menu FOREIGN KEY (menu_id) 
        REFERENCES public.menus(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_mp_permission FOREIGN KEY (permission_id) 
        REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_mp_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 2. Indexes for fast mapping lookup queries
CREATE INDEX IF NOT EXISTS idx_mp_menu ON public.menu_permissions(menu_id);
CREATE INDEX IF NOT EXISTS idx_mp_permission ON public.menu_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_mp_created_by ON public.menu_permissions(created_by);

-- 3. Row-Level Security Configuration
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;

-- 3.1 RLS Policies (Allows reading menu permission maps to any authenticated users for sidebar filters checks)
DROP POLICY IF EXISTS policy_menu_permissions_select ON public.menu_permissions;
CREATE POLICY policy_menu_permissions_select
    ON public.menu_permissions
    FOR SELECT
    TO authenticated
    USING (true); -- Read-only access to global layout mapping metadata

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.menu_permissions IS 'Bridge table mapping navigation menus to required permission codes';
COMMENT ON COLUMN public.menu_permissions.menu_id IS 'Target menu catalog mapping reference key';
COMMENT ON COLUMN public.menu_permissions.permission_id IS 'Target permission catalog mapping reference key';
