-- ============================================================================
-- SQL File: 04.08_staff_batch_assignments.sql
-- Domain: Staff Batch Teaching Assignments Bridge
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.staff_batch_assignments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    staff_profile_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_sba_staff FOREIGN KEY (staff_profile_id) 
        REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_sba_batch FOREIGN KEY (tenant_id, batch_id) 
        REFERENCES public.batches(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    CONSTRAINT fk_sba_subject FOREIGN KEY (tenant_id, subject_id) 
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    CONSTRAINT fk_sba_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_sba_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sba_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sba_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_sba_dates CHECK (effective_to IS NULL OR effective_from <= effective_to),
    CONSTRAINT chk_sba_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_sba_staff ON public.staff_batch_assignments(staff_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sba_batch ON public.staff_batch_assignments(batch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sba_tenant ON public.staff_batch_assignments(tenant_id) WHERE deleted_at IS NULL;

-- Trigger to validate staff & batch tenant alignment
CREATE OR REPLACE FUNCTION public.validate_staff_batch_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_tenant UUID;
    batch_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT staff_tenant
    FROM public.staff_profiles 
    WHERE user_id = new.staff_profile_id 
      AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT batch_tenant
    FROM public.batches 
    WHERE id = new.batch_id 
      AND deleted_at IS NULL;

    IF staff_tenant <> new.tenant_id OR batch_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across staff, batch, and assignment records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated staff or batch does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_staff_batch_assignment ON public.staff_batch_assignments;
CREATE TRIGGER trg_biu_staff_batch_assignment
    BEFORE INSERT OR UPDATE ON public.staff_batch_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_staff_batch_assignment();

DROP TRIGGER IF EXISTS trg_bu_staff_batch_assignments_touch_audit ON public.staff_batch_assignments;
CREATE TRIGGER trg_bu_staff_batch_assignments_touch_audit
    BEFORE INSERT OR UPDATE ON public.staff_batch_assignments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.staff_batch_assignments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.staff_batch_assignments IS 'Bridge mapping faculty members to batches and qualified teaching subjects';
