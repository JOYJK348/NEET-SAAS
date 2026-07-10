-- ============================================================================
-- SQL File: 06.04_exam_registrations.sql
-- Domain: Exam Registrations (Eligibility, Admit Cards, Hall Tickets)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. One registration per student per exam — enforced by UNIQUE (exam_id, student_admission_id).
-- 2. Hall ticket and roll number are tenant-scoped unique.
-- 3. Fee tracking supports paid/unpaid/waived scholarship exams.
-- 4. Seating info for offline exam room assignment.
-- 5. registered_at is a business timestamp distinct from created_at audit stamp.
-- 6. RLS: Super Admin → All | Staff → tenant | Student → own registrations.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_registrations (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Registration Context
    exam_id UUID NOT NULL,
    student_admission_id UUID NOT NULL,

    -- Registration Details
    registration_number VARCHAR(100),
    roll_number VARCHAR(100),
    hall_ticket_number VARCHAR(100),

    -- Status
    registration_status registration_status_enum NOT NULL DEFAULT 'REGISTERED',

    -- Eligibility
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    eligibility_remarks TEXT,

    -- Fee Status
    fee_status fee_status_enum NOT NULL DEFAULT 'NOT_APPLICABLE',

    -- Admit Card
    admit_card_issued BOOLEAN NOT NULL DEFAULT FALSE,
    admit_card_issued_at TIMESTAMP WITH TIME ZONE,
    admit_card_downloaded_at TIMESTAMP WITH TIME ZONE,

    -- Registration Timestamp (business, not audit)
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Seating (for offline exams)
    seat_number VARCHAR(50),
    room_number VARCHAR(50),

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_registrations_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_registrations_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_exam_registrations_admission FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_registrations_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_registrations_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_registrations_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Business Rules
    CONSTRAINT chk_registration_admit_card CHECK (
        (admit_card_issued = false AND admit_card_issued_at IS NULL AND admit_card_downloaded_at IS NULL)
        OR (admit_card_issued = true AND admit_card_issued_at IS NOT NULL)
    ),
    CONSTRAINT chk_registration_version CHECK (version > 0),

    -- Unique: One registration per student per exam
    CONSTRAINT uq_exam_registration UNIQUE (exam_id, student_admission_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_registrations_exam ON public.exam_registrations(exam_id, registration_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_registrations_enrollment ON public.exam_registrations(student_admission_id, exam_id) WHERE deleted_at IS NULL;

-- 2.1 Unique indexes for tenant-scoped roll number and hall ticket
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_exam_reg_tenant_roll
    ON public.exam_registrations(tenant_id, roll_number)
    WHERE roll_number IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_exam_reg_tenant_hall
    ON public.exam_registrations(tenant_id, hall_ticket_number)
    WHERE hall_ticket_number IS NOT NULL AND deleted_at IS NULL;

-- 3. Trigger: validate tenant alignment
CREATE OR REPLACE FUNCTION public.validate_exam_registration_tenant()
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
    FROM public.student_admissions WHERE id = NEW.student_admission_id AND deleted_at IS NULL;

    IF exam_tenant <> NEW.tenant_id OR enrollment_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across exam, admission, and registration';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated exam or enrollment does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_registration_tenant_validation ON public.exam_registrations;
CREATE TRIGGER trg_biu_exam_registration_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exam_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_registration_tenant();

-- 3.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_registrations_touch_audit ON public.exam_registrations;
CREATE TRIGGER trg_bu_exam_registrations_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_registrations
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. RLS
ALTER TABLE public.exam_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_registrations_select ON public.exam_registrations;
CREATE POLICY policy_exam_registrations_select
    ON public.exam_registrations FOR SELECT TO authenticated
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
                JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
                WHERE sbe.student_admission_id = exam_registrations.student_admission_id
                  AND sa.student_profile_id = auth.uid()
                  AND sbe.deleted_at IS NULL
            )
            OR EXISTS (
                SELECT 1 FROM public.student_batch_enrollments sbe
                JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
                JOIN public.student_parents sp ON sp.student_profile_id = sa.student_profile_id
                WHERE sbe.student_admission_id = exam_registrations.student_admission_id
                  AND sp.parent_profile_id = auth.uid()
                  AND sbe.deleted_at IS NULL
            )
        )
    );

-- 4.1 Complementary RLS on public.exams to grant student/parent access
-- Created here because exam_registrations must exist before this policy can reference it.
DROP POLICY IF EXISTS policy_exams_student_select ON public.exams;
CREATE POLICY policy_exams_student_select
    ON public.exams FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.exam_registrations er
            JOIN public.student_batch_enrollments sbe ON sbe.student_admission_id = er.student_admission_id
            JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
            WHERE er.exam_id = exams.id
              AND sa.student_profile_id = auth.uid()
              AND er.deleted_at IS NULL
        )
    );

COMMENT ON TABLE public.exam_registrations IS 'Student exam registrations, eligibility, and admit card tracking';
COMMENT ON COLUMN public.exam_registrations.roll_number IS 'Assigned roll number for the exam, unique within tenant';
COMMENT ON COLUMN public.exam_registrations.hall_ticket_number IS 'Hall ticket number, unique within tenant';
COMMENT ON COLUMN public.exam_registrations.registration_status IS 'Lifecycle: REGISTERED, CONFIRMED, CANCELLED, ABSENT';
COMMENT ON COLUMN public.exam_registrations.fee_status IS 'Fee tracking: PAID, UNPAID, PARTIAL, WAIVED, NOT_APPLICABLE';
COMMENT ON COLUMN public.exam_registrations.registered_at IS 'Business registration timestamp (distinct from created_at audit stamp)';
COMMENT ON COLUMN public.exam_registrations.version IS 'Optimistic concurrency control version stamp';
