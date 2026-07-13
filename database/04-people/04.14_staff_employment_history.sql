-- ============================================================================
-- SQL File: 04.10_staff_employment_history.sql
-- Domain: Staff Employment Careers Lifecycle History Ledger
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "staff_employment_history" tracks career status logs (promotions, transfers, designation track record).
-- 2. Strictly append-only. UPDATE and DELETE are blocked via trigger rules.
-- 3. Stores snapshots of designation_id, department_id, salary changes, and employment_status states.
-- 4. Enables RLS: visible only to Platform Super Admins, Tenant HR manager, and the employee.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.staff_employment_history (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    staff_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    designation_id UUID NOT NULL,
    department_id UUID NULL,
    
    employment_status employment_status_enum NOT NULL,
    event_reason TEXT NULL, -- e.g. PROMOTION, ROLE_TRANSFER, SUSPENSION_NOTICE
    
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    
    -- Inline constraints & validations
    CONSTRAINT fk_seh_staff FOREIGN KEY (staff_profile_id) 
        REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_seh_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    -- Dynamic check: references designation_id using composite key validation checks
    CONSTRAINT fk_seh_designation FOREIGN KEY (tenant_id, designation_id) 
        REFERENCES public.designations(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    -- Dynamic check: references department_id using composite key validation checks
    CONSTRAINT fk_seh_department FOREIGN KEY (tenant_id, department_id) 
        REFERENCES public.departments(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    CONSTRAINT fk_seh_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_seh_reason CHECK (event_reason IS NULL OR length(trim(event_reason)) > 0)
);

-- 2. Indexes for fast career timeline audit reports
CREATE INDEX IF NOT EXISTS idx_seh_staff_lookup ON public.staff_employment_history(staff_profile_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_seh_tenant_lookup ON public.staff_employment_history(tenant_id);

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert)
CREATE OR REPLACE FUNCTION public.validate_staff_history_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_tenant UUID;
    designation_tenant UUID;
    department_tenant UUID;
BEGIN
    -- Resolve staff tenant reference
    SELECT tenant_id INTO STRICT staff_tenant
    FROM public.staff_profiles 
    WHERE user_id = new.staff_profile_id 
      AND deleted_at IS NULL;
      
    -- Resolve designation tenant reference
    SELECT tenant_id INTO STRICT designation_tenant
    FROM public.designations 
    WHERE id = new.designation_id 
      AND deleted_at IS NULL;

    -- Resolve department tenant reference if mapped
    IF new.department_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT department_tenant
        FROM public.departments 
        WHERE id = new.department_id 
          AND deleted_at IS NULL;
          
        IF department_tenant <> new.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: department_id tenant mismatch';
        END IF;
    END IF;

    -- Enforce absolute tenant alignment
    IF staff_tenant <> new.tenant_id OR designation_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across staff, designation, and history records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated profiles or designations do not exist or are soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_bi_staff_history_validation ON public.staff_employment_history;
CREATE TRIGGER trg_bi_staff_history_validation
    BEFORE INSERT ON public.staff_employment_history
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_staff_history_record();

-- 3.1 Trigger to enforce append-only behavior (strictly blocks updates and deletes)
CREATE OR REPLACE FUNCTION public.lock_append_only_employment_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Employment history is append-only. Modifying or deleting records is prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_staff_history_lock ON public.staff_employment_history;
CREATE TRIGGER trg_ud_staff_history_lock
    BEFORE UPDATE OR DELETE ON public.staff_employment_history
    FOR EACH ROW
    EXECUTE FUNCTION public.lock_append_only_employment_history();

-- 4. Row-Level Security Configuration
ALTER TABLE public.staff_employment_history ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure career ledger access is securely constrained)
DROP POLICY IF EXISTS policy_seh_select ON public.staff_employment_history;
CREATE POLICY policy_seh_select
    ON public.staff_employment_history
    FOR SELECT
    TO authenticated
    USING (
        current_user_is_super_admin()
        -- Self linked staff check
        OR (staff_profile_id = auth.uid())
        -- Mapped tenant HR managers and administrators selection
        OR (
            tenant_id = current_tenant_id()
            AND EXISTS (
                SELECT 1 
                FROM public.user_roles ur
                JOIN public.role_permissions rp ON rp.role_id = ur.role_id
                JOIN public.permissions p ON p.id = rp.permission_id
                WHERE ur.user_id = auth.uid()
                  AND (ur.effective_from <= NOW() AND (ur.effective_to IS NULL OR ur.effective_to > NOW()))
                  AND p.permission_key = 'staff.read'
                  AND p.deleted_at IS NULL
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.staff_employment_history IS 'Workforce career status history ledger (Strictly Append-Only)';
COMMENT ON COLUMN public.staff_employment_history.staff_profile_id IS 'Key mapping staff profiles records';
COMMENT ON COLUMN public.staff_employment_history.designation_id IS 'Key mapping designation profiles records';
COMMENT ON COLUMN public.staff_employment_history.effective_date IS 'Operational start date of role assignment event';
COMMENT ON COLUMN public.staff_employment_history.employment_status IS 'Employment status classifications transitioned to during event';
