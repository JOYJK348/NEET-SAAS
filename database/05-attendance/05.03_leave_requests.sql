-- ============================================================================
-- SQL File: 05.03_leave_requests.sql
-- Domain: Student and Staff Leave Request Workflow
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Supports both STUDENT and STAFF requesters via requester_type discriminator.
-- 2. Overlap validation trigger prevents double-booking within same requester.
-- 3. Approval lifecycle: PENDING → APPROVED / REJECTED / CANCELLED.
-- 4. Approved/rejected records carry approver stamp + reason.
-- 5. RLS: Requester sees own | HR/Admin sees all tenant | Super Admin sees all.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    requester_id UUID NOT NULL,         -- References public.users.id
    requester_type user_type_enum NOT NULL, -- STUDENT or STAFF

    leave_category leave_category_enum NOT NULL DEFAULT 'CASUAL',
    leave_status leave_status_enum NOT NULL DEFAULT 'PENDING',

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    reason TEXT NOT NULL,

    approved_by UUID NULL,              -- References public.users.id
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    rejection_reason TEXT NULL,

    cancelled_by UUID NULL,             -- References public.users.id
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_lr_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_lr_requester FOREIGN KEY (requester_id)
        REFERENCES public.users(id) ON DELETE RESTRICT,

    CONSTRAINT fk_lr_approved_by FOREIGN KEY (approved_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lr_cancelled_by FOREIGN KEY (cancelled_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lr_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lr_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lr_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_lr_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_lr_requester_type CHECK (requester_type IN ('STUDENT', 'STAFF')),
    CONSTRAINT chk_lr_reason CHECK (length(trim(reason)) > 0),
    CONSTRAINT chk_lr_approval CHECK (
        (leave_status = 'PENDING' AND approved_by IS NULL AND approved_at IS NULL)
        OR (leave_status IN ('APPROVED', 'REJECTED') AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
        OR (leave_status = 'CANCELLED')
    ),
    CONSTRAINT chk_lr_cancellation CHECK (
        (leave_status <> 'CANCELLED' AND cancelled_by IS NULL AND cancelled_at IS NULL)
        OR (leave_status = 'CANCELLED' AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL)
    ),
    CONSTRAINT chk_lr_rejection CHECK (
        leave_status <> 'REJECTED' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
    ),
    CONSTRAINT chk_lr_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lr_requester ON public.leave_requests(requester_id, leave_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lr_dates ON public.leave_requests(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lr_tenant ON public.leave_requests(tenant_id, leave_status) WHERE deleted_at IS NULL;

-- 3. Trigger: prevent overlapping active leave for the same requester
CREATE OR REPLACE FUNCTION public.validate_leave_request_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    overlap_count INT;
BEGIN
    SELECT COUNT(*) INTO overlap_count
    FROM public.leave_requests
    WHERE requester_id = NEW.requester_id
      AND id <> NEW.id
      AND leave_status IN ('PENDING', 'APPROVED')
      AND deleted_at IS NULL
      AND daterange(start_date, end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]');

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Leave conflict: an overlapping active leave request already exists for this requester';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_leave_request_overlap ON public.leave_requests;
CREATE TRIGGER trg_biu_leave_request_overlap
    BEFORE INSERT OR UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_leave_request_overlap();

-- 3.1 Trigger: enforce valid leave status state transitions
CREATE OR REPLACE FUNCTION public.validate_leave_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only enforce on UPDATE (INSERT starts at PENDING, always valid)
    IF TG_OP = 'UPDATE' AND OLD.leave_status <> NEW.leave_status THEN
        -- Define valid transitions as a matrix
        IF NOT (
            -- PENDING can move to: APPROVED, REJECTED, CANCELLED
            (OLD.leave_status = 'PENDING'  AND NEW.leave_status IN ('APPROVED', 'REJECTED', 'CANCELLED'))
            -- APPROVED can only move to: CANCELLED
         OR (OLD.leave_status = 'APPROVED' AND NEW.leave_status = 'CANCELLED')
            -- Terminal states: REJECTED and CANCELLED cannot transition further
        ) THEN
            RAISE EXCEPTION 'Invalid leave status transition: % → % is not permitted',
                OLD.leave_status, NEW.leave_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bu_leave_status_transition ON public.leave_requests;
CREATE TRIGGER trg_bu_leave_status_transition
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_leave_status_transition();

-- 3.2 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_leave_requests_touch_audit ON public.leave_requests;
CREATE TRIGGER trg_bu_leave_requests_touch_audit
    BEFORE INSERT OR UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_leave_requests_select ON public.leave_requests;
CREATE POLICY policy_leave_requests_select
    ON public.leave_requests FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Requester sees own requests
            OR (requester_id = auth.uid())
            -- HR/Admin staff sees all tenant requests
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1
                    FROM public.user_roles ur
                    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
                    JOIN public.permissions p ON p.id = rp.permission_id
                    WHERE ur.user_id = auth.uid()
                      AND ur.is_active = true
                      AND p.code = 'staff.read'
                      AND p.deleted_at IS NULL
                )
            )
            -- Parent sees child's leave requests
            OR EXISTS (
                SELECT 1 FROM public.student_parents sp
                WHERE sp.parent_profile_id = auth.uid()
                  AND sp.student_profile_id = leave_requests.requester_id
            )
        )
    );

COMMENT ON TABLE public.leave_requests IS 'Leave request workflow for students and staff members';
COMMENT ON COLUMN public.leave_requests.requester_type IS 'Discriminator: STUDENT or STAFF';
COMMENT ON COLUMN public.leave_requests.leave_status IS 'Approval workflow state: PENDING → APPROVED / REJECTED / CANCELLED';
COMMENT ON COLUMN public.leave_requests.version IS 'Optimistic concurrency control version stamp';
