-- ============================================================================
-- SQL File: 09.05_live_class_attendance.sql
-- Domain: Student Attendance Summary Analytics (Post Session Execution)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures materialized summary metrics derived from raw connection events.
-- 2. Calculates attention scores, camera focus durations, network disconnect instances.
-- 3. Enables manual override workflows for administrators.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- 5. Restricts duplicate mappings per student and session.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_attendance (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,
    
    -- Attendance status metrics
    attendance_status attendance_status_enum NOT NULL DEFAULT 'ABSENT',
    
    -- Analytics Materialization
    total_duration_seconds INTEGER NOT NULL DEFAULT 0,
    late_minutes SMALLINT NOT NULL DEFAULT 0,
    early_leave_minutes SMALLINT NOT NULL DEFAULT 0,
    network_disconnect_count SMALLINT NOT NULL DEFAULT 0,
    
    -- Attention Metrics
    camera_on_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0.00% to 100.00%
    mic_on_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    attention_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    focus_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    
    -- Adjustments
    manual_override BOOLEAN NOT NULL DEFAULT false,
    marked_by UUID NULL, -- References public.users.id
    marked_at TIMESTAMP WITH TIME ZONE NULL,
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
    CONSTRAINT fk_lca_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lca_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lca_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lca_marked_by FOREIGN KEY (marked_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_lca_durations CHECK (total_duration_seconds >= 0),
    CONSTRAINT chk_lca_late CHECK (late_minutes >= 0),
    CONSTRAINT chk_lca_early CHECK (early_leave_minutes >= 0),
    CONSTRAINT chk_lca_disconnects CHECK (network_disconnect_count >= 0),
    
    CONSTRAINT chk_lca_camera CHECK (camera_on_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_lca_mic CHECK (mic_on_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_lca_attention CHECK (attention_score BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_lca_focus CHECK (focus_score BETWEEN 0.00 AND 100.00),
    
    CONSTRAINT chk_lca_override_audit CHECK (
        (manual_override = false AND marked_by IS NULL AND marked_at IS NULL)
        OR (manual_override = true AND marked_by IS NOT NULL AND marked_at IS NOT NULL)
    ),
    
    CONSTRAINT chk_lca_version CHECK (version > 0)
);

-- 2. Unique: one attendance summary record per student per session
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_lca_session_student
    ON public.live_class_attendance(tenant_id, session_id, student_admission_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_lca_session ON public.live_class_attendance(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lca_student ON public.live_class_attendance(student_admission_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lca_status ON public.live_class_attendance(attendance_status) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_attendance DROP CONSTRAINT IF EXISTS uq_live_class_attendance_tenant_id CASCADE;
ALTER TABLE public.live_class_attendance ADD CONSTRAINT uq_live_class_attendance_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_attendance_touch_audit ON public.live_class_attendance;
CREATE TRIGGER trg_biu_live_class_attendance_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_attendance
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks for student admission mapping
CREATE OR REPLACE FUNCTION public.validate_live_class_attendance_tenant()
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
        RAISE EXCEPTION 'Tenant mismatch validation failed: student admission tenant does not match live class attendance tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_live_class_attendance_tenant_validate ON public.live_class_attendance;
CREATE TRIGGER trg_biu_live_class_attendance_tenant_validate
    BEFORE INSERT OR UPDATE ON public.live_class_attendance
    FOR EACH ROW
    EXECUTE FUNCTION validate_live_class_attendance_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_attendance_policy ON public.live_class_attendance
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_attendance_policy ON public.live_class_attendance
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_attendance_policy ON public.live_class_attendance
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_attendance_policy ON public.live_class_attendance
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
