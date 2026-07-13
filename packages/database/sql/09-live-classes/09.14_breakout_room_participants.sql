-- ============================================================================
-- SQL File: 09.14_breakout_room_participants.sql
-- Domain: Session Breakout Room Participant Memberships
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs which students joined which breakout rooms within the main session.
-- 2. Tracks membership timings (joined, left).
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.breakout_room_participants (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    breakout_room_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,
    
    -- Timings
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_brpart_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_brpart_room FOREIGN KEY (tenant_id, breakout_room_id)
        REFERENCES public.live_class_breakout_rooms(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_brpart_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_brpart_times CHECK (left_at IS NULL OR left_at > joined_at),
    CONSTRAINT chk_brpart_version CHECK (version > 0)
);

-- 2. Unique: a student can only join one breakout room at a time (active join)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_brpart_active_membership
    ON public.breakout_room_participants(tenant_id, student_admission_id)
    WHERE left_at IS NULL AND deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_brpart_room ON public.breakout_room_participants(breakout_room_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brpart_student ON public.breakout_room_participants(student_admission_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_breakout_room_participants_touch_audit ON public.breakout_room_participants;
CREATE TRIGGER trg_biu_breakout_room_participants_touch_audit
    BEFORE INSERT OR UPDATE ON public.breakout_room_participants
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks for student admission mapping
CREATE OR REPLACE FUNCTION public.validate_breakout_room_participant_tenant()
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
        RAISE EXCEPTION 'Tenant mismatch validation failed: student admission tenant does not match breakout room participant log tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_breakout_room_participant_tenant_validate ON public.breakout_room_participants;
CREATE TRIGGER trg_biu_breakout_room_participant_tenant_validate
    BEFORE INSERT OR UPDATE ON public.breakout_room_participants
    FOR EACH ROW
    EXECUTE FUNCTION validate_breakout_room_participant_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.breakout_room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_breakout_room_participants_policy ON public.breakout_room_participants
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_breakout_room_participants_policy ON public.breakout_room_participants
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_breakout_room_participants_policy ON public.breakout_room_participants
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_breakout_room_participants_policy ON public.breakout_room_participants
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
