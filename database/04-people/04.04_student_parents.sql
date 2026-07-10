-- ============================================================================
-- SQL File: 04.04_student_parents.sql
-- Domain: Student to Parent Relationship Mappings Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table mapping relationships between students and parent profiles.
-- 2. Uses composite primary key: PRIMARY KEY (student_profile_id, parent_profile_id).
-- 3. Stores relationship classifications using parent_relationship_type_enum values.
-- 4. Ensures referential integrity: cascade delete parent/student links, restrict deletion of active guardians.
-- 5. Enables RLS allowing selections to Platform Super Admins, Tenant Staff, and self-linked parent/student accounts.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_parents (
    student_profile_id UUID NOT NULL,
    parent_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    relationship_type parent_relationship_type_enum NOT NULL DEFAULT 'GUARDIAN',
    is_primary_guardian BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    
    PRIMARY KEY (student_profile_id, parent_profile_id),

    -- Inline constraints & validations
    CONSTRAINT fk_sp_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_sp_parent FOREIGN KEY (parent_profile_id) 
        REFERENCES public.parent_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_sp_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_sp_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL
);

-- 2. Indexes for fast mapping resolution
CREATE INDEX IF NOT EXISTS idx_sp_parent_lookup ON public.student_parents(parent_profile_id);
CREATE INDEX IF NOT EXISTS idx_sp_tenant_lookup ON public.student_parents(tenant_id);

-- 2.1 Enforce single primary guardian contact mapping per student profile
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sp_primary_guardian 
    ON public.student_parents(student_profile_id) 
    WHERE is_primary_guardian = true;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_student_parent_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
    parent_tenant UUID;
BEGIN
    -- Resolve student tenant reference
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles 
    WHERE user_id = new.student_profile_id 
      AND deleted_at IS NULL;
      
    -- Resolve parent tenant reference
    SELECT tenant_id INTO STRICT parent_tenant
    FROM public.parent_profiles 
    WHERE user_id = new.parent_profile_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF student_tenant <> new.tenant_id OR parent_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across student, parent, and mapping records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated profiles do not exist or are soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_parent_validation ON public.student_parents;
CREATE TRIGGER trg_biu_student_parent_validation
    BEFORE INSERT OR UPDATE ON public.student_parents
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_parent_mapping();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure student parent relationships are securely constrained)
DROP POLICY IF EXISTS policy_student_parents_select ON public.student_parents;
CREATE POLICY policy_student_parents_select
    ON public.student_parents
    FOR SELECT
    TO authenticated
    USING (
        current_user_is_super_admin()
        -- Self linked student profile select check
        OR (student_profile_id = auth.uid())
        -- Self linked parent profile select check
        OR (parent_profile_id = auth.uid())
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
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.student_parents IS 'Bridge table mapping student profiles to parent/guardian profiles';
COMMENT ON COLUMN public.student_parents.student_profile_id IS 'Key mapping student profiles records';
COMMENT ON COLUMN public.student_parents.parent_profile_id IS 'Key mapping parent profiles records';
COMMENT ON COLUMN public.student_parents.relationship_type IS 'Classification description of relationship mapping (e.g. FATHER, MOTHER)';
COMMENT ON COLUMN public.student_parents.is_primary_guardian IS 'Flag indicating primary emergency contact/billing contact configuration';
