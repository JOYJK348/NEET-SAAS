-- ============================================================================
-- SQL File: 04.06_staff_departments.sql
-- Domain: Staff to Branch/Department Mappings Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table mapping workforce employees to their branch-scoped departments (from 01-master).
-- 2. Uses composite primary key: PRIMARY KEY (staff_profile_id, branch_id, department_id).
-- 3. Enables primary department tracking flag and active state controls.
-- 4. Ensures referential integrity: cascade delete staff associations, restrict deletion of department configurations.
-- 5. Enables RLS allowing selections to Platform Super Admins, Tenant HR, and the staff member themselves.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.staff_departments (
    staff_profile_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    department_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    is_primary BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (staff_profile_id, branch_id, department_id),

    -- Inline constraints & validations
    CONSTRAINT fk_sd_staff FOREIGN KEY (staff_profile_id) 
        REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
        
    -- Dynamic check: references branch_departments using composite key validation checks
    CONSTRAINT fk_sd_branch_dept FOREIGN KEY (tenant_id, branch_id, department_id) 
        REFERENCES public.branch_departments(tenant_id, branch_id, department_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    CONSTRAINT fk_sd_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_sd_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sd_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sd_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_sd_version CHECK (version > 0)
);

-- 2. Indexes for fast mapping resolution
CREATE INDEX IF NOT EXISTS idx_sd_staff_lookup ON public.staff_departments(staff_profile_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sd_dept_lookup ON public.staff_departments(tenant_id, branch_id, department_id) WHERE deleted_at IS NULL;

-- 2.1 Enforce single primary department assignment per employee profile
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sd_primary_active 
    ON public.staff_departments(staff_profile_id) 
    WHERE is_primary = true AND is_active = true AND deleted_at IS NULL;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_staff_department_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_tenant UUID;
    dept_tenant UUID;
BEGIN
    -- Resolve staff tenant reference
    SELECT tenant_id INTO STRICT staff_tenant
    FROM public.staff_profiles 
    WHERE user_id = new.staff_profile_id 
      AND deleted_at IS NULL;

    -- Resolve branch department tenant reference from 01.05 DDL
    SELECT tenant_id INTO STRICT dept_tenant
    FROM public.branch_departments 
    WHERE branch_id = new.branch_id 
      AND department_id = new.department_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF staff_tenant <> new.tenant_id OR dept_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across staff, department, and mapping records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated profiles or departments do not exist or are soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_staff_department_validation ON public.staff_departments;
CREATE TRIGGER trg_biu_staff_department_validation
    BEFORE INSERT OR UPDATE ON public.staff_departments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_staff_department_mapping();

-- 3.1 Attach standard touch audit columns trigger
DROP TRIGGER IF EXISTS trg_bu_staff_departments_touch_audit ON public.staff_departments;
CREATE TRIGGER trg_bu_staff_departments_touch_audit
    BEFORE INSERT OR UPDATE ON public.staff_departments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.staff_departments ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure staff department mapping is securely constrained)
DROP POLICY IF EXISTS policy_staff_departments_select ON public.staff_departments;
CREATE POLICY policy_staff_departments_select
    ON public.staff_departments
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Self mapping check
            OR (staff_profile_id = auth.uid())
            -- Mapped tenant staff selection
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() 
                      AND user_type = 'STAFF'::user_type_enum 
                      AND deleted_at IS NULL
                )
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.staff_departments IS 'Bridge table mapping employee profiles to branch departments';
COMMENT ON COLUMN public.staff_departments.staff_profile_id IS 'Key mapping staff profiles records';
COMMENT ON COLUMN public.staff_departments.branch_id IS 'Key mapping branch records';
COMMENT ON COLUMN public.staff_departments.department_id IS 'Key mapping department records';
COMMENT ON COLUMN public.staff_departments.is_primary IS 'Flag indicating primary employment department (used to resolve HOD status)';
COMMENT ON COLUMN public.staff_departments.version IS 'Optimistic concurrency control version stamp';
