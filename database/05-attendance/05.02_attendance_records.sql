-- ============================================================================
-- SQL File: 05.02_attendance_records.sql
-- Domain: Individual Student Attendance Records
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. One row per student per session — enforced by UNIQUE(session_id, student_id).
-- 2. Attendance cannot be entered for a LOCKED or DRAFT session (trigger).
-- 3. Validation trigger checks student belongs to the batch of that session.
-- 4. Records are soft-deleted only; actual corrections go to attendance_adjustments.
-- 5. RLS: Staff → mark & view | Student → own rows | Parent → child rows.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    attendance_session_id UUID NOT NULL,
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized for RLS performance. Validated by trigger.

    attendance_status attendance_status_enum NOT NULL DEFAULT 'ABSENT',
    late_minutes SMALLINT NOT NULL DEFAULT 0,

    marked_by UUID NULL,  -- References public.users.id (staff who marked)
    marked_at TIMESTAMP WITH TIME ZONE NULL,

    remarks TEXT NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_ar_session FOREIGN KEY (attendance_session_id)
        REFERENCES public.attendance_sessions(id) ON DELETE RESTRICT,

    CONSTRAINT fk_ar_student FOREIGN KEY (student_profile_id)
        REFERENCES public.student_profiles(user_id) ON DELETE RESTRICT,

    CONSTRAINT fk_ar_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_ar_marked_by FOREIGN KEY (marked_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ar_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ar_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ar_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_ar_late_minutes CHECK (late_minutes >= 0 AND late_minutes < 1440),
    CONSTRAINT chk_ar_remarks CHECK (remarks IS NULL OR length(trim(remarks)) > 0),
    CONSTRAINT chk_ar_version CHECK (version > 0)
);

-- 2. Unique: one record per student per session
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ar_session_student
    ON public.attendance_records(attendance_session_id, student_profile_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_ar_student ON public.attendance_records(student_profile_id, attendance_session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ar_session ON public.attendance_records(attendance_session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ar_status ON public.attendance_records(attendance_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ar_tenant ON public.attendance_records(tenant_id) WHERE deleted_at IS NULL;

-- 3. Trigger: block marking on DRAFT or LOCKED sessions
CREATE OR REPLACE FUNCTION public.validate_attendance_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    session_rec RECORD;
    enrolled BOOLEAN;
BEGIN
    -- Resolve session details
    SELECT tenant_id, batch_id, session_status INTO STRICT session_rec
    FROM public.attendance_sessions
    WHERE id = NEW.attendance_session_id AND deleted_at IS NULL;

    -- Block marking on DRAFT or LOCKED sessions
    IF session_rec.session_status = 'LOCKED' THEN
        RAISE EXCEPTION 'Cannot modify attendance: session is LOCKED';
    END IF;
    IF session_rec.session_status = 'DRAFT' THEN
        RAISE EXCEPTION 'Cannot mark attendance: session is still in DRAFT status';
    END IF;

    -- Validate student was enrolled in this batch ON the attendance date
    -- joined_at <= attendance_date AND (left_at IS NULL OR left_at >= attendance_date)
    SELECT EXISTS (
        SELECT 1 FROM public.student_batch_enrollments
        WHERE student_profile_id = NEW.student_profile_id
          AND batch_id = session_rec.batch_id
          AND status = 'ACTIVE'
          AND joined_at <= session_rec.attendance_date
          AND (left_at IS NULL OR left_at >= session_rec.attendance_date)
          AND deleted_at IS NULL
    ) INTO enrolled;

    IF NOT enrolled THEN
        RAISE EXCEPTION 'Integrity violation: student was not enrolled in this batch on the session date';
    END IF;

    -- Tenant alignment
    IF session_rec.tenant_id <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between session and record';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Attendance session does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate session lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_attendance_record_validation ON public.attendance_records;
CREATE TRIGGER trg_biu_attendance_record_validation
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_attendance_record();

-- 3.1 Trigger: block DELETE when parent session is LOCKED
CREATE OR REPLACE FUNCTION public.prevent_locked_record_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    session_status_val attendance_session_status_enum;
BEGIN
    SELECT session_status INTO session_status_val
    FROM public.attendance_sessions
    WHERE id = OLD.attendance_session_id;

    IF session_status_val = 'LOCKED' THEN
        RAISE EXCEPTION 'Cannot delete attendance record: parent session is LOCKED';
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_bd_attendance_record_lock_check ON public.attendance_records;
CREATE TRIGGER trg_bd_attendance_record_lock_check
    BEFORE DELETE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_locked_record_delete();

-- 3.2 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_attendance_records_touch_audit ON public.attendance_records;
CREATE TRIGGER trg_bu_attendance_records_touch_audit
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_attendance_records_select ON public.attendance_records;
CREATE POLICY policy_attendance_records_select
    ON public.attendance_records FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Staff: same tenant
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users WHERE id = auth.uid()
                    AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
            -- Student: own records only
            OR (student_profile_id = auth.uid())
            -- Parent: linked child's records
            OR EXISTS (
                SELECT 1 FROM public.student_parents sp
                WHERE sp.parent_profile_id = auth.uid()
                  AND sp.student_profile_id = attendance_records.student_profile_id
            )
        )
    );

COMMENT ON TABLE public.attendance_records IS 'Individual student attendance check-in rows per session';
COMMENT ON COLUMN public.attendance_records.attendance_status IS 'Check-in classification: PRESENT, ABSENT, LATE, HALF_DAY, EXCUSED';
COMMENT ON COLUMN public.attendance_records.late_minutes IS 'Minutes late (0 for on-time entries)';
COMMENT ON COLUMN public.attendance_records.version IS 'Optimistic concurrency control version stamp';
