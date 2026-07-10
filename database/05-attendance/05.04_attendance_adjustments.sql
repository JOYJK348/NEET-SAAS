-- ============================================================================
-- SQL File: 05.04_attendance_adjustments.sql
-- Domain: Attendance Correction Audit History Ledger (Append-Only)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Stores every change made to an attendance record as an immutable audit row.
-- 2. Strictly append-only: UPDATE and DELETE are blocked via trigger.
-- 3. Captures old_status → new_status, reason, and actor for full traceability.
-- 4. Linked to attendance_records; does NOT replace the record row.
-- 5. RLS: Super Admin / HR Staff → all | Staff → sessions they manage | Student → own.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.attendance_adjustments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    attendance_record_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized for RLS performance.

    old_status attendance_status_enum NOT NULL,
    new_status attendance_status_enum NOT NULL,

    reason TEXT NOT NULL,

    changed_by UUID NOT NULL,  -- References public.users.id
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- No updated_at / version: append-only, no mutations allowed
    -- Audit Stamps (insert-only)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,

    -- Constraints
    CONSTRAINT fk_aa_record FOREIGN KEY (attendance_record_id)
        REFERENCES public.attendance_records(id) ON DELETE RESTRICT,

    CONSTRAINT fk_aa_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_aa_changed_by FOREIGN KEY (changed_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_aa_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_aa_status_change CHECK (old_status <> new_status),
    CONSTRAINT chk_aa_reason CHECK (length(trim(reason)) > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_aa_record ON public.attendance_adjustments(attendance_record_id);
CREATE INDEX IF NOT EXISTS idx_aa_tenant ON public.attendance_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aa_changed_by ON public.attendance_adjustments(changed_by);
CREATE INDEX IF NOT EXISTS idx_aa_changed_at ON public.attendance_adjustments(changed_at DESC);

-- 3. Trigger: enforce append-only (block UPDATE and DELETE)
CREATE OR REPLACE FUNCTION public.lock_attendance_adjustments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Attendance adjustments are append-only. Modifying or deleting records is prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_attendance_adjustments_lock ON public.attendance_adjustments;
CREATE TRIGGER trg_ud_attendance_adjustments_lock
    BEFORE UPDATE OR DELETE ON public.attendance_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION public.lock_attendance_adjustments();

-- 3.1 Trigger: validate record exists and tenant matches
CREATE OR REPLACE FUNCTION public.validate_attendance_adjustment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    record_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT record_tenant
    FROM public.attendance_records
    WHERE id = NEW.attendance_record_id AND deleted_at IS NULL;

    IF record_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between adjustment and attendance record';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Attendance record does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate record lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_bi_attendance_adjustment_validation ON public.attendance_adjustments;
CREATE TRIGGER trg_bi_attendance_adjustment_validation
    BEFORE INSERT ON public.attendance_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_attendance_adjustment();

-- 4. RLS
ALTER TABLE public.attendance_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_attendance_adjustments_select ON public.attendance_adjustments;
CREATE POLICY policy_attendance_adjustments_select
    ON public.attendance_adjustments FOR SELECT TO authenticated
    USING (
        current_user_is_super_admin()
        -- Staff: same tenant
        OR (
            tenant_id = current_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid()
                AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
            )
        )
        -- Student: own record adjustments
        OR EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = attendance_adjustments.attendance_record_id
              AND ar.student_profile_id = auth.uid()
        )
    );

COMMENT ON TABLE public.attendance_adjustments IS 'Append-only audit trail for attendance record corrections';
COMMENT ON COLUMN public.attendance_adjustments.old_status IS 'Status before correction was applied';
COMMENT ON COLUMN public.attendance_adjustments.new_status IS 'Status after correction was applied';
COMMENT ON COLUMN public.attendance_adjustments.reason IS 'Mandatory justification for the correction';
