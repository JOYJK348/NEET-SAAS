-- ============================================================================
-- SQL File: 04.07_staff_subjects.sql
-- Domain: Staff Subject Teaching Qualifications Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table mapping teachers/faculty to subjects they are qualified to teach (from 01-master).
-- 2. Uses composite primary key: PRIMARY KEY (staff_profile_id, subject_id).
-- 3. Enables status tracking for active qualification mappings.
-- 4. Ensures referential integrity: cascade delete staff associations, restrict deletion of master subjects.
-- 5. Enables RLS allowing selections to Platform Super Admins, Tenant Staff, and the staff member themselves.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.staff_subjects (
    staff_profile_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (staff_profile_id, subject_id),

    -- Inline constraints & validations
    CONSTRAINT fk_ss_staff FOREIGN KEY (staff_profile_id) 
        REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
        
    -- Dynamic check: references subject_id using composite key validation checks from public.subjects DDL
    CONSTRAINT fk_ss_subject FOREIGN KEY (tenant_id, subject_id) 
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    CONSTRAINT fk_ss_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_ss_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ss_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ss_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_ss_version CHECK (version > 0)
);

-- 2. Indexes for fast lookup resolution
CREATE INDEX IF NOT EXISTS idx_ss_staff_lookup ON public.staff_subjects(staff_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ss_subject_lookup ON public.staff_subjects(subject_id) WHERE deleted_at IS NULL;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_staff_subject_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_tenant UUID;
    subject_tenant UUID;
BEGIN
    -- Resolve staff tenant reference
    SELECT tenant_id INTO STRICT staff_tenant
    FROM public.staff_profiles 
    WHERE user_id = new.staff_profile_id 
      AND deleted_at IS NULL;

    -- Resolve subject tenant reference from public.subjects DDL
    SELECT tenant_id INTO STRICT subject_tenant
    FROM public.subjects 
    WHERE id = new.subject_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF staff_tenant <> new.tenant_id OR subject_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across staff, subject, and mapping records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated profiles or subjects do not exist or are soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_staff_subject_validation ON public.staff_subjects;
CREATE TRIGGER trg_biu_staff_subject_validation
    BEFORE INSERT OR UPDATE ON public.staff_subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_staff_subject_mapping();

-- 3.1 Attach standard touch audit columns trigger
DROP TRIGGER IF EXISTS trg_bu_staff_subjects_touch_audit ON public.staff_subjects;
CREATE TRIGGER trg_bu_staff_subjects_touch_audit
    BEFORE INSERT OR UPDATE ON public.staff_subjects
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.staff_subjects ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure staff subject mapping is securely constrained)
DROP POLICY IF EXISTS policy_staff_subjects_select ON public.staff_subjects;
CREATE POLICY policy_staff_subjects_select
    ON public.staff_subjects
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
COMMENT ON TABLE public.staff_subjects IS 'Bridge table mapping employee profiles to qualified teaching subjects';
COMMENT ON COLUMN public.staff_subjects.staff_profile_id IS 'Key mapping staff profiles records';
COMMENT ON COLUMN public.staff_subjects.subject_id IS 'Key mapping subject records';
COMMENT ON COLUMN public.staff_subjects.is_active IS 'Flag indicating active status of the teaching qualification';
COMMENT ON COLUMN public.staff_subjects.version IS 'Optimistic concurrency control version stamp';
