-- ============================================================================
-- SQL File: 02.05_user_roles.sql
-- Domain: Authentication Role-Based Access Control (RBAC) User Roles Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "user_roles" functions as a pure normalized bridge table mapping users to roles.
-- 2. Removed redundant "tenant_id" column to eliminate synchronization risk,
--    deriving tenant context dynamically through joins with the parent tables.
-- 3. Primary key is composite: PRIMARY KEY (user_id, role_id) to eliminate surrogate UUID overhead.
-- 4. Added "expires_at" and "is_active" columns to natively support temporary, delegation, and guest roles.
-- 5. Simplified RLS selection checks (removed volatile now() evaluations to prevent index overheads).
-- 6. Added "assigned_source" (ENUM tracking migration/API origins) and "assignment_reason" audits.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    
    assigned_source role_assignment_source NOT NULL DEFAULT 'MANUAL',
    assignment_reason TEXT NULL,
    assigned_by UUID NULL, -- References public.users.id
    
    -- Audit Stamps (Insert/Delete only mapping, no update/version audit needed)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id (FK added in post-auth migration step)
    
    PRIMARY KEY (user_id, role_id),
    
    -- Standard foreign keys referencing catalogs
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
        
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) 
        REFERENCES public.roles(id) ON DELETE CASCADE,
        
    CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) 
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_ur_expiry CHECK (expires_at IS NULL OR expires_at > created_at),
    CONSTRAINT chk_ur_reason CHECK (assignment_reason IS NULL OR (length(trim(assignment_reason)) > 0 AND length(assignment_reason) <= 500))
);

-- 2. Indexes for fast mapping lookup queries, active states, and audits
CREATE INDEX IF NOT EXISTS idx_ur_user_active ON public.user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ur_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_ur_created_by ON public.user_roles(created_by);
CREATE INDEX IF NOT EXISTS idx_ur_assigned_by ON public.user_roles(assigned_by);

-- 3. Trigger function to enforce basic referential integrity (checks soft delete state on insert)
CREATE OR REPLACE FUNCTION public.check_user_role_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_exists BOOLEAN;
    role_exists BOOLEAN;
BEGIN
    SELECT EXISTS(

        SELECT 1 FROM public.users 
        WHERE id = new.user_id AND deleted_at IS NULL
    ) INTO user_exists;
    
    SELECT EXISTS(
        SELECT 1 FROM public.roles 
        WHERE id = new.role_id AND deleted_at IS NULL
    ) INTO role_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'Referential integrity violation: User is invalid or soft-deleted';
    END IF;
    
    IF NOT role_exists THEN
        RAISE EXCEPTION 'Referential integrity violation: Role is invalid or soft-deleted';
    END IF;
    
    RETURN new;
END;
$$;

-- 3.1 Attach Verification Trigger to user_roles
DROP TRIGGER IF EXISTS trg_bi_user_roles_integrity_check ON public.user_roles;
CREATE TRIGGER trg_bi_user_roles_integrity_check
    BEFORE INSERT ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_role_integrity();

-- 4. Row-Level Security Configuration
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Restrict select access dynamically by joining with users table, keeping validation lightweight)
DROP POLICY IF EXISTS policy_user_roles_select ON public.user_roles;
CREATE POLICY policy_user_roles_select
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (
        -- Users can always see their own role assignments
        (user_id = auth.uid() AND is_active = true)
        OR current_user_is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = user_roles.user_id
            AND u.tenant_id = current_tenant_id()
            AND u.deleted_at IS NULL
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.user_roles IS 'Bridge table mapping users to functional roles';
COMMENT ON COLUMN public.user_roles.user_id IS 'Target user profile reference key';
COMMENT ON COLUMN public.user_roles.role_id IS 'Target role mapping reference key';
COMMENT ON COLUMN public.user_roles.is_active IS 'Active mapping assignment state';
COMMENT ON COLUMN public.user_roles.expires_at IS 'Expiration date and time for temporary roles delegation';
COMMENT ON COLUMN public.user_roles.assigned_source IS 'Origin source of role mapping creation (e.g. MANUAL, SYSTEM, MIGRATION)';
COMMENT ON COLUMN public.user_roles.assignment_reason IS 'Operational explanation notes for the role assignment';
COMMENT ON COLUMN public.user_roles.assigned_by IS 'Profile ID of the administrator who assigned the role';
