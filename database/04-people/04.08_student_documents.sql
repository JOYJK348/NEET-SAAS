-- ============================================================================
-- SQL File: 04.08_student_documents.sql
-- Domain: Student Verification & Identity Documents
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "student_documents" links to student_profiles, referencing uploaded files objects.
-- 2. Tracks document details: document_type (e.g. TC, NEET_ADMIT_CARD), storage_object_id, verified status.
-- 3. Enables RLS: visible only to platform admins, tenant staff, self, and verified parents.
-- 4. Automatically cascades on student profile deletions.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    document_type VARCHAR(50) NOT NULL, -- e.g. TC, NEET_ADMIT_CARD, MARKSHEET, IDENTITY_PROOF
    storage_object_id VARCHAR(255) NOT NULL, -- Unique identifier linking to remote storage object bucket (e.g. Supabase bucket path)
    
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID NULL, -- References public.users.id
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_sd_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_sd_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_sd_verified_by FOREIGN KEY (verified_by) 
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sd_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sd_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sd_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_sd_verified CHECK (
        (is_verified = false AND verified_by IS NULL AND verified_at IS NULL)
        OR (is_verified = true AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_sd_version CHECK (version > 0)
);

-- 2. Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_sd_student_lookup ON public.student_documents(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sd_tenant_lookup ON public.student_documents(tenant_id) WHERE deleted_at IS NULL;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_student_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
BEGIN
    -- Resolve student tenant reference
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles 
    WHERE user_id = new.student_profile_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF student_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and document records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_document_validation ON public.student_documents;
CREATE TRIGGER trg_biu_student_document_validation
    BEFORE INSERT OR UPDATE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_document();

-- 3.1 Attach standard touch audit columns trigger
DROP TRIGGER IF EXISTS trg_bu_student_documents_touch_audit ON public.student_documents;
CREATE TRIGGER trg_bu_student_documents_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure student document access is securely constrained)
DROP POLICY IF EXISTS policy_student_documents_select ON public.student_documents;
CREATE POLICY policy_student_documents_select
    ON public.student_documents
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            -- Self linked student profile select check
            OR (student_profile_id = auth.uid())
            -- Mapped tenant staff selection
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() 
                      AND user_type = 'STAFF'::user_type_enum 
                      AND deleted_at IS NULL
                )
            )
            -- Mapped parent verification
            OR EXISTS (
                SELECT 1 
                FROM public.student_parents sp
                JOIN public.parent_profiles pp ON pp.user_id = sp.parent_profile_id
                WHERE sp.student_profile_id = student_documents.student_profile_id
                  AND pp.user_id = auth.uid()
                  AND pp.deleted_at IS NULL
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.student_documents IS 'Uploaded student credentials verification registry';
COMMENT ON COLUMN public.student_documents.student_profile_id IS 'Key mapping student profiles records';
COMMENT ON COLUMN public.student_documents.document_type IS 'Category description of verification profile (e.g. NEET_ADMIT_CARD)';
COMMENT ON COLUMN public.student_documents.storage_object_id IS 'Object storage bucket identifier path key';
COMMENT ON COLUMN public.student_documents.is_verified IS 'Validation marker configuration';
COMMENT ON COLUMN public.student_documents.version IS 'Optimistic concurrency control version stamp';
