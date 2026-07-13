-- ============================================================================
-- SQL File: 09.12_live_class_raise_hands.sql
-- Domain: Session Raise Hands Doubts Queue (Interactive Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Models student hand raising requests launched within a session.
-- 2. Scopes response statuses via raise_hand_status_enum (PENDING, ACCEPTED, REJECTED, RESOLVED).
-- 3. Enables detailed response timers logging request durations.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_raise_hands (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,
    
    -- Status
    status raise_hand_status_enum NOT NULL DEFAULT 'PENDING',
    
    -- Interaction timings
    raised_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    responded_at TIMESTAMP WITH TIME ZONE NULL,
    responded_by UUID NULL, -- References public.users.id
    
    response_duration_seconds INTEGER NULL,
    remarks VARCHAR(250) NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcraise_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcraise_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcraise_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcraise_responder FOREIGN KEY (responded_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_lcraise_duration CHECK (response_duration_seconds IS NULL OR response_duration_seconds >= 0),
    CONSTRAINT chk_lcraise_times CHECK (responded_at IS NULL OR responded_at > raised_at),
    CONSTRAINT chk_lcraise_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcraise_session ON public.live_class_raise_hands(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcraise_status ON public.live_class_raise_hands(status) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_raise_hands_touch_audit ON public.live_class_raise_hands;
CREATE TRIGGER trg_biu_live_class_raise_hands_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_raise_hands
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks for student admission mapping
CREATE OR REPLACE FUNCTION public.validate_live_class_raise_hand_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_tenant UUID;
BEGIN
    SELECT tenant_id INTO v_student_tenant 
    FROM public.student_admissions 
    WHERE id = NEW.student_admission_id;
    
    IF v_student_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: student admission tenant does not match hand raise request tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_live_class_raise_hand_tenant_validate ON public.live_class_raise_hands;
CREATE TRIGGER trg_biu_live_class_raise_hand_tenant_validate
    BEFORE INSERT OR UPDATE ON public.live_class_raise_hands
    FOR EACH ROW
    EXECUTE FUNCTION validate_live_class_raise_hand_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_raise_hands ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_raise_hands_policy ON public.live_class_raise_hands
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_raise_hands_policy ON public.live_class_raise_hands
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_raise_hands_policy ON public.live_class_raise_hands
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_raise_hands_policy ON public.live_class_raise_hands
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
