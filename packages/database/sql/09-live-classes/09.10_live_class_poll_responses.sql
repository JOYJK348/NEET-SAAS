-- ============================================================================
-- SQL File: 09.10_live_class_poll_responses.sql
-- Domain: Session Poll Responses Log (Interaction Registry)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs every student response transaction.
-- 2. Append-only ledger; updates are blocked via database trigger.
-- 3. Stores answer choice selections, answer speeds, and correctness status.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- 5. Restricts duplicate submissions per student per poll.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_poll_responses (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    poll_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,
    
    selected_option VARCHAR(100) NOT NULL, -- Stored as label (e.g. 'A') or index
    
    time_taken_seconds SMALLINT NULL,
    is_correct BOOLEAN NULL, -- Evaluated post-response
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcpres_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_lcpres_poll FOREIGN KEY (tenant_id, poll_id)
        REFERENCES public.live_class_polls(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcpres_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_lcpres_time CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0),
    CONSTRAINT chk_lcpres_version CHECK (version > 0)
);

-- 2. Unique: one response per student per poll
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_lcpres_poll_student
    ON public.live_class_poll_responses(tenant_id, poll_id, student_admission_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_lcpres_poll ON public.live_class_poll_responses(poll_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcpres_student ON public.live_class_poll_responses(student_admission_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_poll_responses_touch_audit ON public.live_class_poll_responses;
CREATE TRIGGER trg_biu_live_class_poll_responses_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_poll_responses
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates on existing records)
CREATE OR REPLACE FUNCTION public.prevent_live_class_poll_response_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: Poll responses are append-only. Updates are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_u_prevent_live_class_poll_response ON public.live_class_poll_responses;
CREATE TRIGGER trg_u_prevent_live_class_poll_response
    BEFORE UPDATE ON public.live_class_poll_responses
    FOR EACH ROW
    EXECUTE FUNCTION prevent_live_class_poll_response_update();

-- 3.2 Tenant validation checks for student admission mapping
CREATE OR REPLACE FUNCTION public.validate_live_class_poll_response_tenant()
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
        RAISE EXCEPTION 'Tenant mismatch validation failed: student admission tenant does not match poll response tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_live_class_poll_response_tenant_validate ON public.live_class_poll_responses;
CREATE TRIGGER trg_biu_live_class_poll_response_tenant_validate
    BEFORE INSERT OR UPDATE ON public.live_class_poll_responses
    FOR EACH ROW
    EXECUTE FUNCTION validate_live_class_poll_response_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_poll_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_poll_responses_policy ON public.live_class_poll_responses
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_poll_responses_policy ON public.live_class_poll_responses
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE policy needed as update triggers raise exceptions anyway
CREATE POLICY delete_live_class_poll_responses_policy ON public.live_class_poll_responses
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
