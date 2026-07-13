-- ============================================================================
-- SQL File: 04.01_staff_profiles.sql
-- Domain: Workforce Profiles Extension
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "staff_profiles" extends the public.users authentication profile (1:1 relation).
-- 2. Refers user_id directly as primary key to eliminate redundant surrogate keys.
-- 3. Connects designation_id foreign key from master catalogs instead of raw strings.
-- 4. Automatically propagates user deletion via CASCADE.
-- 5. Enables RLS allowing selections to Platform Super Admins, Tenant HR managers, and the self user.
-- 6. Resolves denormalization concerns: tenant_id is preserved for RLS isolation, validated on INSERT/UPDATE.
-- 7. Integrates native ENUM types for employment classification and active statuses.
-- 8. Maps global audit tracking keys to public.users to record system updates.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    user_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    employee_code VARCHAR(30) NOT NULL,
    designation_id UUID NOT NULL,
    
    employment_type employment_type_enum NOT NULL DEFAULT 'FULL_TIME',
    employment_status employment_status_enum NOT NULL DEFAULT 'ACTIVE',
    
    joined_at DATE NOT NULL,
    resigned_at DATE NULL,
    
    official_email email_address NULL, -- Optional distinct HR contact (defaults to users login email if unset)
    work_phone phone_number NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
        
    CONSTRAINT fk_staff_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    -- Dynamic check: references designation_id using composite key validation checks
    CONSTRAINT fk_staff_designation FOREIGN KEY (tenant_id, designation_id) 
        REFERENCES public.designations(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_staff_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_staff_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_staff_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    -- Enforce slash and alphanumeric employee codes
    CONSTRAINT chk_staff_employee_code CHECK (employee_code ~ '^[A-Za-z0-9_./-]+$'),
    CONSTRAINT chk_staff_resignation CHECK (resigned_at IS NULL OR resigned_at >= joined_at),
    -- Verify status consistency rules
    CONSTRAINT chk_staff_status_dates CHECK (
        (employment_status IN ('ACTIVE', 'ON_NOTICE', 'SUSPENDED') AND resigned_at IS NULL)
        OR (employment_status = 'RESIGNED' AND resigned_at IS NOT NULL)
        OR (employment_status = 'TERMINATED' AND resigned_at IS NOT NULL)
    ),
    CONSTRAINT chk_staff_version CHECK (version > 0)
);

-- 2. Indexes for fast HR searches, active rosters, and designations filtering
CREATE INDEX IF NOT EXISTS idx_staff_tenant_status ON public.staff_profiles(tenant_id, employment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_designation ON public.staff_profiles(tenant_id, designation_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_joined ON public.staff_profiles(joined_at);

-- 2.1 Enforce unique employee code within the same tenant scoped checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_staff_tenant_code 
    ON public.staff_profiles(tenant_id, employee_code) 
    WHERE deleted_at IS NULL;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_staff_profile_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    parent_user_record RECORD;
BEGIN
    -- Resolve parent user attributes
    SELECT tenant_id, user_type INTO STRICT parent_user_record
    FROM public.users 
    WHERE id = new.user_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF parent_user_record.tenant_id <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between users and staff_profiles';
    END IF;

    -- Enforce users type categorization
    IF parent_user_record.user_type <> 'STAFF'::user_type_enum THEN
        RAISE EXCEPTION 'Security restriction: Selected user type must be STAFF';
    END IF;
    
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_staff_profile_validation ON public.staff_profiles;
CREATE TRIGGER trg_biu_staff_profile_validation
    BEFORE INSERT OR UPDATE ON public.staff_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_staff_profile_user();

-- 3.1 Attach standard touch audit columns trigger
DROP TRIGGER IF EXISTS trg_bu_staff_profiles_touch_audit ON public.staff_profiles;
CREATE TRIGGER trg_bu_staff_profiles_touch_audit
    BEFORE INSERT OR UPDATE ON public.staff_profiles
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure staff profile access is securely constrained)
DROP POLICY IF EXISTS policy_staff_profiles_select ON public.staff_profiles;
CREATE POLICY policy_staff_profiles_select
    ON public.staff_profiles
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Self mapping check
            OR (user_id = auth.uid())
            -- Mapped tenant HR managers and administrators selection
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 
                    FROM public.user_roles ur
                    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
                    JOIN public.permissions p ON p.id = rp.permission_id
                    WHERE ur.user_id = auth.uid()
                      AND ur.is_active = true
                      AND p.code = 'staff.read'
                      AND p.deleted_at IS NULL
                )
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.staff_profiles IS 'Workforce employee profile details directory (1:1 with public.users)';
COMMENT ON COLUMN public.staff_profiles.user_id IS 'Primary key linking directly back to public.users(id)';
COMMENT ON COLUMN public.staff_profiles.tenant_id IS 'Denormalized from users.tenant_id for RLS performance. Validated by trigger.';
COMMENT ON COLUMN public.staff_profiles.employee_code IS 'Alphanumeric employee identification code unique within the tenant (supports slash formats)';
COMMENT ON COLUMN public.staff_profiles.designation_id IS 'Reference key mapping to employee functional designation';
COMMENT ON COLUMN public.staff_profiles.employment_type IS 'Contractual classification categories for workforce employees';
COMMENT ON COLUMN public.staff_profiles.employment_status IS 'Status states mapping active employee track record';
COMMENT ON COLUMN public.staff_profiles.version IS 'Optimistic concurrency control version stamp';
