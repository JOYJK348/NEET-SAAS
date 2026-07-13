-- ============================================================================
-- SQL File: 04.07_student_documents.sql
-- Domain: Student Identity and Compliance Documents Directory
-- ============================================================================

SET search_path = public;

-- Idempotent schema alterations to add columns if the table already exists in database
ALTER TABLE public.student_documents ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.student_documents ADD COLUMN IF NOT EXISTS document_type_id VARCHAR(50);
ALTER TABLE public.student_documents ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255);
ALTER TABLE public.student_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Allow legacy columns to be nullable since they are replaced by document_type_id and storage_key
ALTER TABLE public.student_documents ALTER COLUMN document_type DROP NOT NULL;
ALTER TABLE public.student_documents ALTER COLUMN storage_object_id DROP NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'student_documents' 
          AND column_name = 'document_type'
    ) THEN
        UPDATE public.student_documents SET document_type_id = document_type WHERE document_type_id IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'student_documents' 
          AND column_name = 'storage_object_id'
    ) THEN
        UPDATE public.student_documents SET storage_key = storage_object_id WHERE storage_key IS NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    
    document_type_id VARCHAR(50) NOT NULL, -- e.g. AADHAAR, TC, COMMUNITY_CERT, PHOTO, SIGNATURE, MARKSHEET
    storage_key VARCHAR(255) NOT NULL, -- Storage bucket object identifier
    
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, EXPIRED, REJECTED
    verified_by UUID NULL,
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    expiry_date DATE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,

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
        
    CONSTRAINT chk_sd_status CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED')),
    CONSTRAINT chk_sd_verification CHECK (
        (status <> 'VERIFIED' AND verified_by IS NULL AND verified_at IS NULL)
        OR (status = 'VERIFIED' AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_sd_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_sd_student_lookup ON public.student_documents(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sd_tenant_lookup ON public.student_documents(tenant_id) WHERE deleted_at IS NULL;

-- Trigger to validate student profile referential integrity
CREATE OR REPLACE FUNCTION public.validate_student_document_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles 
    WHERE user_id = new.student_profile_id 
      AND deleted_at IS NULL;

    IF student_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between student and document records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile does not exist';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_document_validation ON public.student_documents;
CREATE TRIGGER trg_biu_student_document_validation
    BEFORE INSERT OR UPDATE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_document_tenant();

DROP TRIGGER IF EXISTS trg_bu_student_documents_touch_audit ON public.student_documents;
CREATE TRIGGER trg_bu_student_documents_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.student_documents IS 'Uploaded student identity verification registry';
