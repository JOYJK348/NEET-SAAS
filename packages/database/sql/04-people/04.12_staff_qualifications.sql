-- ============================================================================
-- SQL File: 04.10_staff_qualifications.sql
-- Domain: Staff Credentials and Qualifications Registry
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.staff_qualifications (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    staff_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    degree VARCHAR(150) NOT NULL, -- B.Sc, M.Sc, MBBS, etc.
    institution VARCHAR(200) NOT NULL,
    year_completed INTEGER NOT NULL,
    experience_months INTEGER NOT NULL DEFAULT 0,
    certificates_metadata JSONB NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_sq_staff FOREIGN KEY (staff_profile_id) 
        REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_sq_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_sq_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sq_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sq_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_sq_year CHECK (year_completed >= 1950 AND year_completed <= EXTRACT(YEAR FROM CURRENT_DATE)),
    CONSTRAINT chk_sq_experience CHECK (experience_months >= 0),
    CONSTRAINT chk_sq_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_sq_staff ON public.staff_qualifications(staff_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sq_tenant ON public.staff_qualifications(tenant_id) WHERE deleted_at IS NULL;

-- Trigger to validate staff & qualification tenant alignment
CREATE OR REPLACE FUNCTION public.validate_staff_qualification_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT staff_tenant
    FROM public.staff_profiles 
    WHERE user_id = new.staff_profile_id 
      AND deleted_at IS NULL;

    IF staff_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between staff and qualification records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated staff profile does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_staff_qualification ON public.staff_qualifications;
CREATE TRIGGER trg_biu_staff_qualification
    BEFORE INSERT OR UPDATE ON public.staff_qualifications
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_staff_qualification_tenant();

DROP TRIGGER IF EXISTS trg_bu_staff_qualifications_touch_audit ON public.staff_qualifications;
CREATE TRIGGER trg_bu_staff_qualifications_touch_audit
    BEFORE INSERT OR UPDATE ON public.staff_qualifications
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.staff_qualifications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.staff_qualifications IS 'Staff credentials and qualified degrees logs';
