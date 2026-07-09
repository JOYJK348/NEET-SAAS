-- ============================================================================
-- SQL File: 01.13_batches.sql
-- Domain: Master Core Batches Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "batches" maps operational classroom groupings.
-- 2. Uses composite foreign keys (tenant_id + branch_id/course_id/academic_year_id/delivery_type_id)
--    to guarantee complete referential safety without orphan records.
-- 3. status uses the global "batch_status_type" enum to track lifecycle states.
-- 4. Added "allow_new_admissions" boolean to manage enrollment statuses independently of is_active.
-- 5. Implements partial unique indexes on (tenant_id, code) and (tenant_id, lower(trim(name))) where deleted_at IS NULL.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    course_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    delivery_type_id UUID NOT NULL,
    
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    status batch_status_type NOT NULL DEFAULT 'PLANNED',
    max_students SMALLINT NOT NULL DEFAULT 40,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    allow_new_admissions BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_batches_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Composite foreign keys enforcing tenant safety
    CONSTRAINT fk_batches_branch_tenant FOREIGN KEY (tenant_id, branch_id) 
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_batches_course_tenant FOREIGN KEY (tenant_id, course_id) 
        REFERENCES public.courses(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_batches_academic_year_tenant FOREIGN KEY (tenant_id, academic_year_id) 
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_batches_delivery_type_tenant FOREIGN KEY (tenant_id, delivery_type_id) 
        REFERENCES public.batch_delivery_types(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_batches_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_batches_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]{1,29}$'),
    CONSTRAINT chk_batches_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_batches_max_students CHECK (max_students BETWEEN 1 AND 500),
    CONSTRAINT chk_batches_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_batches_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search and active listing lookups (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_batches_tenant_branch_active 
    ON public.batches(tenant_id, branch_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_batches_tenant_course_active 
    ON public.batches(tenant_id, course_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_batches_tenant_ay_active 
    ON public.batches(tenant_id, academic_year_id, is_active) 
    WHERE deleted_at IS NULL;

-- Dynamic search index for keyword scans on name
CREATE INDEX IF NOT EXISTS idx_batches_tenant_name_search
    ON public.batches(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream student/attendance tables)
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS uq_batches_tenant_id;
ALTER TABLE public.batches ADD CONSTRAINT uq_batches_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_batches_tenant_code 
    ON public.batches(tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_batches_tenant_name_lower
    ON public.batches(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_batches_touch_audit ON public.batches;
CREATE TRIGGER trg_biu_batches_touch_audit
    BEFORE INSERT OR UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_batches_select ON public.batches;
CREATE POLICY policy_batches_select
    ON public.batches
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.batches IS 'Operational batch enrollment groups directory per tenant';
COMMENT ON COLUMN public.batches.code IS 'Uppercase batch identifier code (e.g. NEET_2027_M1)';
COMMENT ON COLUMN public.batches.status IS 'Lifecycle stage of the batch (e.g. PLANNED, ACTIVE)';
COMMENT ON COLUMN public.batches.allow_new_admissions IS 'Flag controlling wizard enrollment availability';
COMMENT ON COLUMN public.batches.max_students IS 'Maximum student enrollment limit override';
COMMENT ON COLUMN public.batches.version IS 'Optimistic concurrency control version stamp';
