-- ============================================================================
-- SQL File: 05.05_leave_attachments.sql
-- Domain: Leave Request Supporting Documents
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "leave_attachments" stores proof documents uploaded against a leave request.
-- 2. Tracks storage bucket path, document type, uploaded by, and verification status.
-- 3. Automatically cascades on leave request deletion.
-- 4. Verification requires verified_by + verified_at to both be set (enforced by CHECK).
-- 5. RLS: Requester sees own | HR sees all tenant | Super Admin sees all.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.leave_attachments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    leave_request_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized for RLS performance.

    document_type VARCHAR(50) NOT NULL, -- e.g. MEDICAL_CERTIFICATE, HOSPITAL_BILL, PARENT_LETTER
    storage_object_id VARCHAR(255) NOT NULL, -- Unique path key in storage bucket
    bucket_name VARCHAR(100) NOT NULL,       -- Storage bucket name (e.g. 'leave-docs')
    mime_type VARCHAR(100) NOT NULL,         -- e.g. application/pdf, image/jpeg
    file_size_bytes BIGINT NOT NULL,         -- Raw file size for quota/validation checks

    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID NULL,  -- References public.users.id
    verified_at TIMESTAMP WITH TIME ZONE NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_la_leave_request FOREIGN KEY (leave_request_id)
        REFERENCES public.leave_requests(id) ON DELETE CASCADE,

    CONSTRAINT fk_la_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON DELETE RESTRICT,

    CONSTRAINT fk_la_verified_by FOREIGN KEY (verified_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_la_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_la_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_la_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT chk_la_document_type CHECK (length(trim(document_type)) > 0),
    CONSTRAINT chk_la_storage_object CHECK (length(trim(storage_object_id)) > 0),
    CONSTRAINT chk_la_bucket_name CHECK (length(trim(bucket_name)) > 0),
    CONSTRAINT chk_la_mime_type CHECK (length(trim(mime_type)) > 0),
    CONSTRAINT chk_la_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_la_verified CHECK (
        (is_verified = false AND verified_by IS NULL AND verified_at IS NULL)
        OR (is_verified = true AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_la_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_la_leave_request ON public.leave_attachments(leave_request_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_la_tenant ON public.leave_attachments(tenant_id) WHERE deleted_at IS NULL;

-- 3. Trigger: validate tenant alignment with leave request
CREATE OR REPLACE FUNCTION public.validate_leave_attachment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT request_tenant
    FROM public.leave_requests
    WHERE id = NEW.leave_request_id AND deleted_at IS NULL;

    IF request_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between leave attachment and leave request';
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Leave request does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate leave request lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_leave_attachment_validation ON public.leave_attachments;
CREATE TRIGGER trg_biu_leave_attachment_validation
    BEFORE INSERT OR UPDATE ON public.leave_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_leave_attachment();

-- 3.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_leave_attachments_touch_audit ON public.leave_attachments;
CREATE TRIGGER trg_bu_leave_attachments_touch_audit
    BEFORE INSERT OR UPDATE ON public.leave_attachments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. RLS
ALTER TABLE public.leave_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_leave_attachments_select ON public.leave_attachments;
CREATE POLICY policy_leave_attachments_select
    ON public.leave_attachments FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Requester sees own attachments
            OR EXISTS (
                SELECT 1 FROM public.leave_requests lr
                WHERE lr.id = leave_attachments.leave_request_id
                  AND lr.requester_id = auth.uid()
                  AND lr.deleted_at IS NULL
            )
            -- HR/Admin staff sees all tenant attachments
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
            -- Parent sees child's leave attachments
            OR EXISTS (
                SELECT 1
                FROM public.leave_requests lr
                JOIN public.student_parents sp ON sp.student_profile_id = lr.requester_id
                WHERE lr.id = leave_attachments.leave_request_id
                  AND sp.parent_profile_id = auth.uid()
                  AND lr.deleted_at IS NULL
            )
        )
    );

COMMENT ON TABLE public.leave_attachments IS 'Supporting documents uploaded against leave requests (medical certs, letters, etc.)';
COMMENT ON COLUMN public.leave_attachments.document_type IS 'Category: MEDICAL_CERTIFICATE, HOSPITAL_BILL, PARENT_LETTER, etc.';
COMMENT ON COLUMN public.leave_attachments.storage_object_id IS 'Object storage bucket path key (not a raw URL)';
COMMENT ON COLUMN public.leave_attachments.is_verified IS 'Set to true only when verified_by and verified_at are both populated';
COMMENT ON COLUMN public.leave_attachments.version IS 'Optimistic concurrency control version stamp';
