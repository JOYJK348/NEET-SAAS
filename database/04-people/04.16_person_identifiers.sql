-- ============================================================================
-- SQL File: 04.13_person_identifiers.sql
-- Domain: Student Unique Identification Registry
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.person_identifiers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    identifier_type VARCHAR(50) NOT NULL, -- ADMISSION_NO, ROLL_NO, GOVT_EMIS, AADHAAR, APP_NO, LIBRARY_CARD, HOSTEL_ID
    identifier_value VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_pi_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_pi_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_pi_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_pi_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_pi_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_pi_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_pi_student ON public.person_identifiers(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pi_tenant ON public.person_identifiers(tenant_id) WHERE deleted_at IS NULL;

-- Enforce unique identifier within same tenant and type
CREATE UNIQUE INDEX IF NOT EXISTS uq_pi_tenant_type_val 
    ON public.person_identifiers(tenant_id, identifier_type, identifier_value) 
    WHERE deleted_at IS NULL AND is_active = true;

-- Trigger to validate student profile & identifiers tenant alignment
CREATE OR REPLACE FUNCTION public.validate_person_identifier_tenant()
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
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and identifier records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_person_identifier ON public.person_identifiers;
CREATE TRIGGER trg_biu_person_identifier
    BEFORE INSERT OR UPDATE ON public.person_identifiers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_person_identifier_tenant();

DROP TRIGGER IF EXISTS trg_bu_person_identifiers_touch_audit ON public.person_identifiers;
CREATE TRIGGER trg_bu_person_identifiers_touch_audit
    BEFORE INSERT OR UPDATE ON public.person_identifiers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.person_identifiers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.person_identifiers IS 'Unified student identities mapping index';
