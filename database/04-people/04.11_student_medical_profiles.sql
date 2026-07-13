-- ============================================================================
-- SQL File: 04.09_student_medical_profiles.sql
-- Domain: Student Medical and Health Summary Logs
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.student_medical_profiles (
    student_profile_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    blood_group VARCHAR(10) NULL, -- e.g. A+, B-, O+
    allergies TEXT NULL,
    medical_conditions TEXT NULL,
    emergency_notes TEXT NULL,
    expiry_date DATE NULL, -- Medical declaration document validity limit
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_smp_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_smp_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_smp_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_smp_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_smp_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_smp_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_smp_tenant ON public.student_medical_profiles(tenant_id) WHERE deleted_at IS NULL;

-- Trigger to validate student profile & medical tenant alignment
CREATE OR REPLACE FUNCTION public.validate_student_medical_tenant()
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
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and medical records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_medical_profile ON public.student_medical_profiles;
CREATE TRIGGER trg_biu_student_medical_profile
    BEFORE INSERT OR UPDATE ON public.student_medical_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_medical_tenant();

DROP TRIGGER IF EXISTS trg_bu_student_medical_profiles_touch_audit ON public.student_medical_profiles;
CREATE TRIGGER trg_bu_student_medical_profiles_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_medical_profiles
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.student_medical_profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.student_medical_profiles IS 'Student medical information and health alerts';
