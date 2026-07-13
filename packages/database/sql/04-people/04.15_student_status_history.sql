-- ============================================================================
-- SQL File: 04.12_student_status_history.sql
-- Domain: Student Status Lifecycle Transitions Logs
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.student_status_history (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL, -- ACTIVE, SUSPENDED, LEFT, REJOINED, GRADUATED
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    changed_by UUID NULL,
    reason TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_ssh_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_ssh_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_ssh_changed_by FOREIGN KEY (changed_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ssh_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ssh_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_ssh_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_ssh_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_ssh_student ON public.student_status_history(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ssh_tenant ON public.student_status_history(tenant_id) WHERE deleted_at IS NULL;

-- Trigger to validate student profile & status history tenant alignment
CREATE OR REPLACE FUNCTION public.validate_student_status_history_tenant()
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
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and status history records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_status_history ON public.student_status_history;
CREATE TRIGGER trg_biu_student_status_history
    BEFORE INSERT OR UPDATE ON public.student_status_history
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_status_history_tenant();

DROP TRIGGER IF EXISTS trg_bu_student_status_history_touch_audit ON public.student_status_history;
CREATE TRIGGER trg_bu_student_status_history_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_status_history
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.student_status_history IS 'Student status logs audit history';
