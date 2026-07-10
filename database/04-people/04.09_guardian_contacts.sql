-- ============================================================================
-- SQL File: 04.09_guardian_contacts.sql
-- Domain: Student Emergency & Fallback Guardian Contacts (No login account)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "guardian_contacts" catalogs backup emergency mapping contacts (uncles, wardens) who do not own login credentials.
-- 2. Scopes contacts details: name, phone, relationship_type, email.
-- 3. Enables RLS: visible only to platform admins, tenant staff, the student profile, and mapped parents.
-- 4. Automatically cascades on student profile deletions.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.guardian_contacts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    name VARCHAR(150) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL, -- e.g. UNCLE, GRANDFATHER, HOSTEL_WARDEN, BROTHER
    phone phone_number NOT NULL,
    email email_address NULL,
    
    is_emergency_contact BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_gc_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_gc_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_gc_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_gc_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_gc_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_gc_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_gc_relationship CHECK (length(trim(relationship_type)) > 0),
    CONSTRAINT chk_gc_version CHECK (version > 0)
);

-- 2. Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_gc_student_lookup ON public.guardian_contacts(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gc_tenant_lookup ON public.guardian_contacts(tenant_id) WHERE deleted_at IS NULL;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_guardian_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
BEGIN
    -- Resolve student tenant reference
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles 
    WHERE user_id = new.student_profile_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF student_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and guardian records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_guardian_contact_validation ON public.guardian_contacts;
CREATE TRIGGER trg_biu_guardian_contact_validation
    BEFORE INSERT OR UPDATE ON public.guardian_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_guardian_contact();

-- 3.1 Attach standard touch audit columns trigger
DROP TRIGGER IF EXISTS trg_bu_guardian_contacts_touch_audit ON public.guardian_contacts;
CREATE TRIGGER trg_bu_guardian_contacts_touch_audit
    BEFORE INSERT OR UPDATE ON public.guardian_contacts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.guardian_contacts ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure guardian contact access is securely constrained)
DROP POLICY IF EXISTS policy_guardian_contacts_select ON public.guardian_contacts;
CREATE POLICY policy_guardian_contacts_select
    ON public.guardian_contacts
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Self linked student profile select check
            OR (student_profile_id = auth.uid())
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
            -- Mapped parent verification
            OR EXISTS (
                SELECT 1 
                FROM public.student_parents sp
                JOIN public.parent_profiles pp ON pp.user_id = sp.parent_profile_id
                WHERE sp.student_profile_id = guardian_contacts.student_profile_id
                  AND pp.user_id = auth.uid()
                  AND pp.deleted_at IS NULL
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.guardian_contacts IS 'Fallback emergency contact profiles mapped to students (unauthenticated accounts)';
COMMENT ON COLUMN public.guardian_contacts.student_profile_id IS 'Key mapping student profiles records';
COMMENT ON COLUMN public.guardian_contacts.relationship_type IS 'Category description of relationship mapping (e.g. GRANDFATHER)';
COMMENT ON COLUMN public.guardian_contacts.is_emergency_contact IS 'Flag indicating primary emergency contact fallback targets';
COMMENT ON COLUMN public.guardian_contacts.version IS 'Optimistic concurrency control version stamp';
