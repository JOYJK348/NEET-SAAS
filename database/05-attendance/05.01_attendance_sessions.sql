-- ============================================================================
-- SQL File: 05.01_attendance_sessions.sql
-- Domain: Attendance Sessions Header Registry
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "attendance_sessions" stores one header per attendance-taking event.
-- 2. Composite FKs enforce complete multi-tenant referential safety.
-- 3. session_status tracks lifecycle: DRAFT → OPEN → PUBLISHED → LOCKED.
-- 4. LOCKED sessions cannot be modified (enforced via trigger).
-- 5. Validation trigger ensures staff and batch belong to the same tenant.
-- 6. RLS: Super Admin → All | Staff → own sessions | Student/Parent → linked batch sessions.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    staff_profile_id UUID NOT NULL,

    attendance_date DATE NOT NULL,
    starts_at TIME NOT NULL,
    ends_at TIME NOT NULL,

    session_status attendance_session_status_enum NOT NULL DEFAULT 'DRAFT',

    published_by UUID NULL,  -- References public.users.id
    published_at TIMESTAMP WITH TIME ZONE NULL,

    locked_by UUID NULL,  -- References public.users.id
    locked_at TIMESTAMP WITH TIME ZONE NULL,

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
    CONSTRAINT fk_as_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_as_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_as_academic_year FOREIGN KEY (tenant_id, academic_year_id)
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_as_batch FOREIGN KEY (tenant_id, batch_id)
        REFERENCES public.batches(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_as_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_as_staff FOREIGN KEY (staff_profile_id)
        REFERENCES public.staff_profiles(user_id) ON DELETE RESTRICT,

    CONSTRAINT fk_as_published_by FOREIGN KEY (published_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_locked_by FOREIGN KEY (locked_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_as_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_as_time CHECK (ends_at > starts_at),
    CONSTRAINT chk_as_published CHECK (
        (session_status IN ('DRAFT', 'OPEN') AND published_by IS NULL AND published_at IS NULL)
        OR (session_status IN ('PUBLISHED', 'LOCKED') AND published_by IS NOT NULL AND published_at IS NOT NULL)
    ),
    CONSTRAINT chk_as_locked CHECK (
        (session_status <> 'LOCKED' AND locked_by IS NULL AND locked_at IS NULL)
        OR (session_status = 'LOCKED' AND locked_by IS NOT NULL AND locked_at IS NOT NULL)
    ),
    CONSTRAINT chk_as_remarks CHECK (remarks IS NULL OR length(trim(remarks)) > 0),
    CONSTRAINT chk_as_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_as_batch_date ON public.attendance_sessions(batch_id, attendance_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_as_staff_date ON public.attendance_sessions(staff_profile_id, attendance_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_as_tenant_date ON public.attendance_sessions(tenant_id, attendance_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_as_status ON public.attendance_sessions(session_status) WHERE deleted_at IS NULL;

-- 2.1 Prevent duplicate session for same batch/subject/date/timeslot
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_as_batch_subject_date_slot
    ON public.attendance_sessions(batch_id, subject_id, attendance_date, starts_at)
    WHERE deleted_at IS NULL;

-- 3. Trigger: block modifications on LOCKED sessions
CREATE OR REPLACE FUNCTION public.prevent_locked_session_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.session_status = 'LOCKED' THEN
        RAISE EXCEPTION 'Attendance session is LOCKED and cannot be modified';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bu_prevent_locked_session ON public.attendance_sessions;
CREATE TRIGGER trg_bu_prevent_locked_session
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_locked_session_edit();

-- 3.1 Trigger: validate tenant alignment across staff + batch
CREATE OR REPLACE FUNCTION public.validate_attendance_session()
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
    FROM public.staff_profiles WHERE user_id = NEW.staff_profile_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT batch_tenant
    FROM public.batches WHERE id = NEW.batch_id AND deleted_at IS NULL;

    IF staff_tenant <> NEW.tenant_id OR batch_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across staff, batch, and attendance session';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated staff or batch does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_attendance_session_validation ON public.attendance_sessions;
CREATE TRIGGER trg_biu_attendance_session_validation
    BEFORE INSERT OR UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_attendance_session();

-- 3.2 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_attendance_sessions_touch_audit ON public.attendance_sessions;
CREATE TRIGGER trg_bu_attendance_sessions_touch_audit
    BEFORE INSERT OR UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_attendance_sessions_select ON public.attendance_sessions;
CREATE POLICY policy_attendance_sessions_select
    ON public.attendance_sessions FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Staff: own sessions or same tenant
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users WHERE id = auth.uid()
                    AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
            -- Student: sessions from their active batch
            OR EXISTS (
                SELECT 1 FROM public.student_batch_enrollments sbe
                WHERE sbe.batch_id = attendance_sessions.batch_id
                  AND sbe.student_profile_id = auth.uid()
                  AND sbe.status = 'ACTIVE'
                  AND sbe.deleted_at IS NULL
            )
            -- Parent: sessions for their linked child's batch
            OR EXISTS (
                SELECT 1 FROM public.student_parents sp
                JOIN public.student_batch_enrollments sbe ON sbe.student_profile_id = sp.student_profile_id
                WHERE sp.parent_profile_id = auth.uid()
                  AND sbe.batch_id = attendance_sessions.batch_id
                  AND sbe.status = 'ACTIVE'
                  AND sbe.deleted_at IS NULL
            )
        )
    );

COMMENT ON TABLE public.attendance_sessions IS 'Attendance event header registry per batch/subject/date session';
COMMENT ON COLUMN public.attendance_sessions.session_status IS 'Lifecycle: DRAFT → OPEN → PUBLISHED → LOCKED';
COMMENT ON COLUMN public.attendance_sessions.published_at IS 'Timestamp when session was made visible to students';
COMMENT ON COLUMN public.attendance_sessions.locked_at IS 'Timestamp when session was permanently locked against edits';
COMMENT ON COLUMN public.attendance_sessions.version IS 'Optimistic concurrency control version stamp';
