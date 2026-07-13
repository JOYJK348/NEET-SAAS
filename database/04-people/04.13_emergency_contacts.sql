-- ============================================================================
-- SQL File: 04.11_emergency_contacts.sql
-- Domain: Student Backup Emergency Contact Profiles
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100) NOT NULL, -- e.g. Uncle, Guardian, Hostel Warden, relative
    phone phone_number NOT NULL,
    email email_address NULL,
    
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_ec_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_ec_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_ec_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ec_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ec_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_ec_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_ec_relationship CHECK (length(trim(relationship)) > 0),
    CONSTRAINT chk_ec_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_ec_student ON public.emergency_contacts(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ec_tenant ON public.emergency_contacts(tenant_id) WHERE deleted_at IS NULL;

-- Trigger to validate student profile & contact tenant alignment
CREATE OR REPLACE FUNCTION public.validate_emergency_contact_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles 
    WHERE user_id = new.student_profile_id 
      AND deleted_at IS NULL;

    IF student_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and emergency records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_emergency_contact ON public.emergency_contacts;
CREATE TRIGGER trg_biu_emergency_contact
    BEFORE INSERT OR UPDATE ON public.emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_emergency_contact_tenant();

DROP TRIGGER IF EXISTS trg_bu_emergency_contacts_touch_audit ON public.emergency_contacts;
CREATE TRIGGER trg_bu_emergency_contacts_touch_audit
    BEFORE INSERT OR UPDATE ON public.emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.emergency_contacts IS 'Student backup emergency contacts';
