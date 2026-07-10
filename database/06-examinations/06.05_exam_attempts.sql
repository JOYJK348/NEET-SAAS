-- ============================================================================
-- SQL File: 06.05_exam_attempts.sql
-- Domain: Exam Attempts (One row per student per exam)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. One attempt per student per exam — UNIQUE (exam_id, student_enrollment_id).
-- 2. submitted_by_system flag distinguishes AUTO_SUBMITTED from manual submit.
-- 3. time_taken_seconds is stored for pause-resume scenarios; otherwise derived from timestamps.
-- 4. Device info split into searchable columns (device_type, browser_name, os_name) + device_metadata JSONB for extras.
-- 5. Proctoring fields reserved for future integration.
-- 6. OMR tracking for offline exam answer sheet management.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Attempt Context
    exam_id UUID NOT NULL,
    student_enrollment_id UUID NOT NULL,

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    auto_submitted_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status attempt_status_enum NOT NULL DEFAULT 'NOT_STARTED',

    -- Submitted By System Flag
    submitted_by_system BOOLEAN NOT NULL DEFAULT FALSE,

    -- Device & Session Info (searchable columns extracted for analytics)
    device_type VARCHAR(50),
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    ip_address INET,
    country VARCHAR(100),
    device_metadata JSONB,
    user_agent TEXT,

    -- Time Tracking
    time_taken_seconds INTEGER,
    time_paused_seconds INTEGER DEFAULT 0,

    -- Proctoring (future)
    proctoring_session_id VARCHAR(255),
    proctoring_status VARCHAR(50),

    -- Offline Exam Details
    omr_sheet_id UUID,
    answer_sheet_received BOOLEAN DEFAULT FALSE,
    answer_sheet_received_at TIMESTAMP WITH TIME ZONE,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_attempts_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_attempts_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_attempts_enrollment FOREIGN KEY (tenant_id, student_enrollment_id)
        REFERENCES public.student_batch_enrollments(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_attempts_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_attempts_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_attempts_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Business Rules
    CONSTRAINT chk_attempt_timing CHECK (submitted_at IS NULL OR submitted_at >= started_at),
    CONSTRAINT chk_attempt_auto_submit CHECK (auto_submitted_at IS NULL OR auto_submitted_at >= started_at),
    CONSTRAINT chk_attempt_time_taken CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0),
    CONSTRAINT chk_attempt_time_paused CHECK (time_paused_seconds >= 0),
    CONSTRAINT chk_attempt_answer_sheet CHECK (
        (answer_sheet_received = false AND answer_sheet_received_at IS NULL)
        OR (answer_sheet_received = true AND answer_sheet_received_at IS NOT NULL)
    ),
    CONSTRAINT chk_attempt_submitted_by_system CHECK (
        (submitted_by_system = false AND auto_submitted_at IS NULL)
        OR (submitted_by_system = true AND auto_submitted_at IS NOT NULL)
    ),
    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exam_attempts_tenant_id UNIQUE (tenant_id, id),

    CONSTRAINT chk_attempt_version CHECK (version > 0),

    -- Unique: One attempt per student per exam
    CONSTRAINT uq_exam_attempt UNIQUE (exam_id, student_enrollment_id)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_attempts_tenant_id') THEN
        ALTER TABLE public.exam_attempts ADD CONSTRAINT uq_exam_attempts_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.exam_attempts(exam_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_attempts_enrollment ON public.exam_attempts(student_enrollment_id, exam_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON public.exam_attempts(tenant_id, status, started_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_attempts_omr ON public.exam_attempts(omr_sheet_id) WHERE omr_sheet_id IS NOT NULL AND deleted_at IS NULL;
-- 4. Trigger: validate tenant alignment

CREATE OR REPLACE FUNCTION public.validate_exam_attempt_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    exam_tenant UUID;
    enrollment_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT exam_tenant
    FROM public.exams WHERE id = NEW.exam_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT enrollment_tenant
    FROM public.student_batch_enrollments WHERE id = NEW.student_enrollment_id AND deleted_at IS NULL;

    IF exam_tenant <> NEW.tenant_id OR enrollment_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across exam, enrollment, and attempt';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated exam or enrollment does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_attempt_tenant_validation ON public.exam_attempts;
CREATE TRIGGER trg_biu_exam_attempt_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exam_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_attempt_tenant();

-- 4.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_attempts_touch_audit ON public.exam_attempts;
CREATE TRIGGER trg_bu_exam_attempts_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_attempts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 5. RLS
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_attempts_select ON public.exam_attempts;
CREATE POLICY policy_exam_attempts_select
    ON public.exam_attempts FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                      AND user_type IN ('STAFF'::user_type_enum, 'TUTOR'::user_type_enum)
                      AND deleted_at IS NULL
                )
            )
            OR EXISTS (
                SELECT 1 FROM public.student_batch_enrollments sbe
                WHERE sbe.id = exam_attempts.student_enrollment_id
                  AND sbe.student_profile_id = auth.uid()
                  AND sbe.deleted_at IS NULL
            )
            OR EXISTS (
                SELECT 1 FROM public.student_batch_enrollments sbe
                JOIN public.student_parents sp ON sp.student_profile_id = sbe.student_profile_id
                WHERE sbe.id = exam_attempts.student_enrollment_id
                  AND sp.parent_profile_id = auth.uid()
                  AND sbe.deleted_at IS NULL
            )
        )
    );

COMMENT ON TABLE public.exam_attempts IS 'Student exam attempts with timing, device, and proctoring info';
COMMENT ON COLUMN public.exam_attempts.status IS 'Lifecycle: NOT_STARTED, IN_PROGRESS, SUBMITTED, AUTO_SUBMITTED, ABANDONED, DISQUALIFIED';
COMMENT ON COLUMN public.exam_attempts.submitted_by_system IS 'True if auto-submitted by timer expiry or system trigger';
COMMENT ON COLUMN public.exam_attempts.time_taken_seconds IS 'Actual time spent (excluding paused time); derived from timestamps if NULL';
COMMENT ON COLUMN public.exam_attempts.device_type IS 'Device form factor: DESKTOP, TABLET, MOBILE';
COMMENT ON COLUMN public.exam_attempts.browser_name IS 'Browser name for analytics (Chrome, Firefox, Safari)';
COMMENT ON COLUMN public.exam_attempts.os_name IS 'Operating system for analytics (Windows, macOS, Android, iOS)';
COMMENT ON COLUMN public.exam_attempts.country IS 'Geo-located country for security auditing';
COMMENT ON COLUMN public.exam_attempts.device_metadata IS 'JSONB: extra device attributes (screen resolution, GPU, RAM)';
COMMENT ON COLUMN public.exam_attempts.last_activity_at IS 'Last user activity timestamp for timeout recovery';
COMMENT ON COLUMN public.exam_attempts.version IS 'Optimistic concurrency control version stamp';
