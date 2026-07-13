-- ============================================================================
-- SQL File: 02.04_role_permissions.sql
-- Domain: Authentication Role-Based Access Control (RBAC) Role Permissions Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "role_permissions" functions as a pure normalized bridge table mapping roles to permissions.
-- 2. Removed redundant "tenant_id" column to eliminate synchronization risk,
--    deriving tenant context dynamically through joins with the "roles" table.
-- 3. Primary key is composite: PRIMARY KEY (role_id, permission_id) to eliminate surrogate UUID overhead.
-- 4. Added foreign key references on created_by UUID pointing to public.users(id).
-- 5. Audits are limited to created_at and created_by (no updates/version tracking on pure inserts/deletes).
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    
    -- Audit Stamps (Insert/Delete only mapping, no update/version audit needed)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id (FK added in post-auth migration step)
    
    PRIMARY KEY (role_id, permission_id),
    
    -- Standard foreign keys referencing catalogs
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) 
        REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) 
        REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 2. Indexes for fast mapping lookup queries and audits
CREATE INDEX IF NOT EXISTS idx_rp_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_rp_created_by ON public.role_permissions(created_by);

-- 3. Row-Level Security Configuration
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 3.1 RLS Policies (Restrict select access dynamically by joining with roles table)
DROP POLICY IF EXISTS policy_role_permissions_select ON public.role_permissions;
CREATE POLICY policy_role_permissions_select
    ON public.role_permissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.roles r
            WHERE r.id = role_permissions.role_id
            AND (
                r.tenant_id = current_tenant_id()
                OR (r.tenant_id IS NULL AND current_user_is_super_admin())
            )
            AND r.deleted_at IS NULL
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.role_permissions IS 'Bridge table mapping RBAC permissions to roles';
COMMENT ON COLUMN public.role_permissions.role_id IS 'Target role mapping reference key';
COMMENT ON COLUMN public.role_permissions.permission_id IS 'Target permission catalog mapping reference key';
