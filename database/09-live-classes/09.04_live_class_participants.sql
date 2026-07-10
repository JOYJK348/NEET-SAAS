-- ============================================================================
-- SQL File: 09.04_live_class_participants.sql
-- Domain: Live Class Session Connection Log Ledger
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Tracks every participant (student) connection event history.
-- 2. Stores hardware device characteristics, telemetry coordinates, IP, and network status details.
-- 3. Enables detailed telemetry diagnostics to track connectivity drops.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- 5. Implements security validations to verify student admission status.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_participants (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,
    
    -- Device Telemetry Metadata
    device_type VARCHAR(50) NULL,  -- MOBILE, TABLET, DESKTOP
    browser VARCHAR(100) NULL,
    os VARCHAR(100) NULL,
    ip_address INET NULL,
    network_type VARCHAR(50) NULL, -- WIFI, 4G, 5G, ETHERNET
    
    -- Connection timings
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Toggle Status
    camera_enabled BOOLEAN NOT NULL DEFAULT false,
    mic_enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcpart_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcpart_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcpart_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_lcpart_times CHECK (left_at IS NULL OR left_at > joined_at),
    CONSTRAINT chk_lcpart_version CHECK (version > 0)
);

-- 2. Indexes for fast diagnostic listing
CREATE INDEX IF NOT EXISTS idx_lcpart_session ON public.live_class_participants(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcpart_student ON public.live_class_participants(student_admission_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_participants DROP CONSTRAINT IF EXISTS uq_live_class_participants_tenant_id CASCADE;
ALTER TABLE public.live_class_participants ADD CONSTRAINT uq_live_class_participants_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_participants_touch_audit ON public.live_class_participants;
CREATE TRIGGER trg_biu_live_class_participants_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_participants
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks for student admission mapping
CREATE OR REPLACE FUNCTION public.validate_live_class_participant_tenant()
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
        RAISE EXCEPTION 'Tenant mismatch validation failed: student admission tenant does not match participant log tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_live_class_participant_tenant_validate ON public.live_class_participants;
CREATE TRIGGER trg_biu_live_class_participant_tenant_validate
    BEFORE INSERT OR UPDATE ON public.live_class_participants
    FOR EACH ROW
    EXECUTE FUNCTION validate_live_class_participant_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_participants_policy ON public.live_class_participants
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_participants_policy ON public.live_class_participants
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_participants_policy ON public.live_class_participants
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_participants_policy ON public.live_class_participants
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
