-- ============================================================================
-- SQL File: 04.05_student_batch_enrollments.sql
-- Domain: Student Batch Enrollments Mappings
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table mapping students to classroom batches (from 01-master).
-- 2. composite primary key is omitted to allow historical reenrolling tracks, using surrogate ID instead.
-- 3. Tracks status (ACTIVE, COMPLETED, WITHDRAWN, SUSPENDED), joined_at, left_at, and is_primary flag.
-- 4. Ensures referential integrity: cascade deletes student mappings, restricts deletions of batch resources.
-- 5. Enables RLS allowing selections to Super Admins, staff, self, and mapped parents.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_batch_enrollments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    student_profile_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Denormalized from users.tenant_id for RLS performance. Validated by trigger.
    
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at DATE NULL,
    
    status batch_status_type NOT NULL DEFAULT 'ACTIVE', -- Uses batch_status_type enum for lifecycle tracking
    is_primary BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_sbe_student FOREIGN KEY (student_profile_id) 
        REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
        
    -- Dynamic check: references batch_id using composite key validation checks from public.batches DDL
    CONSTRAINT fk_sbe_batch FOREIGN KEY (tenant_id, batch_id) 
        REFERENCES public.batches(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        
    CONSTRAINT fk_sbe_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_sbe_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sbe_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT fk_sbe_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
        
    CONSTRAINT chk_sbe_duration CHECK (left_at IS NULL OR left_at >= joined_at),
    CONSTRAINT chk_sbe_version CHECK (version > 0)
);

-- 2. Indexes for fast mapping resolution
CREATE INDEX IF NOT EXISTS idx_sbe_student_lookup ON public.student_batch_enrollments(student_profile_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sbe_batch_lookup ON public.student_batch_enrollments(batch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sbe_tenant_lookup ON public.student_batch_enrollments(tenant_id) WHERE deleted_at IS NULL;

-- 2.1 Enforce single active primary batch enrollment per student profile
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sbe_primary_active 
    ON public.student_batch_enrollments(student_profile_id) 
    WHERE is_primary = true AND status = 'ACTIVE' AND deleted_at IS NULL;

-- 3. Trigger to enforce basic referential integrity (checks parent users constraints on insert or update)
CREATE OR REPLACE FUNCTION public.validate_student_batch_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    student_tenant UUID;
    batch_tenant UUID;
BEGIN
    -- Resolve student tenant reference
    SELECT tenant_id INTO STRICT student_tenant
    FROM public.student_profiles 
    WHERE user_id = new.student_profile_id 
      AND deleted_at IS NULL;

    -- Resolve batch tenant reference from public.batches DDL
    SELECT tenant_id INTO STRICT batch_tenant
    FROM public.batches 
    WHERE id = new.batch_id 
      AND deleted_at IS NULL;

    -- Enforce absolute tenant alignment
    IF student_tenant <> new.tenant_id OR batch_tenant <> new.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across student, batch, and enrollment records';
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated student profile or batch does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate mapping lookups matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_batch_enrollment_validation ON public.student_batch_enrollments;
CREATE TRIGGER trg_biu_student_batch_enrollment_validation
    BEFORE INSERT OR UPDATE ON public.student_batch_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_student_batch_enrollment();

-- 3.1 Attach standard touch audit columns trigger
DROP TRIGGER IF EXISTS trg_bu_student_batch_enrollments_touch_audit ON public.student_batch_enrollments;
CREATE TRIGGER trg_bu_student_batch_enrollments_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_batch_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_batch_enrollments ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure student batch mapping is securely constrained)
DROP POLICY IF EXISTS policy_sbe_select ON public.student_batch_enrollments;
CREATE POLICY policy_sbe_select
    ON public.student_batch_enrollments
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
                WHERE sp.student_profile_id = student_batch_enrollments.student_profile_id
                  AND pp.user_id = auth.uid()
                  AND pp.deleted_at IS NULL
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.student_batch_enrollments IS 'Workforce cohort assignments details (mapping students to batches)';
COMMENT ON COLUMN public.student_batch_enrollments.student_profile_id IS 'Key mapping student profiles records';
COMMENT ON COLUMN public.student_batch_enrollments.batch_id IS 'Key mapping batch details records';
COMMENT ON COLUMN public.student_batch_enrollments.joined_at IS 'Historical joined date identifier';
COMMENT ON COLUMN public.student_batch_enrollments.left_at IS 'Historical left date identifier';
COMMENT ON COLUMN public.student_batch_enrollments.version IS 'Optimistic concurrency control version stamp';
