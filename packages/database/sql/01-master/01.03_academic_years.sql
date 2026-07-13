-- ============================================================================
-- SQL File: 01.03_academic_years.sql
-- Domain: Master Core Academic Calendar Years Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "academic_years" tracks year partitions per tenant.
-- 2. Added date overlap prevention using PostgreSQL gist exclusion indices (daterange overlap check).
-- 3. Checked current state mapping: current year must be active.
-- 4. Added display_order and trim validations on description string data.
-- 5. Configured query indexes for current active year settings.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    display_order SMALLINT NOT NULL DEFAULT 1,
    
    is_current BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_academic_years_tenant FOREIGN KEY (tenant_id) REFERENCES public.institutes(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_academic_years_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_academic_years_code_format CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT chk_academic_years_dates CHECK (start_date < end_date),
    CONSTRAINT chk_academic_years_display_order CHECK (display_order > 0),
    CONSTRAINT chk_academic_years_version CHECK (version > 0),
    CONSTRAINT chk_academic_years_description CHECK (description IS NULL OR length(trim(description)) > 0),
    CONSTRAINT chk_academic_years_current_active CHECK (NOT (is_current = true AND is_active = false)),
    
    -- Exclude overlapping date ranges within the same tenant using gist indices
    -- Requires btree_gist extension active in 00.01_extensions
    CONSTRAINT excl_academic_years_overlap EXCLUDE USING gist (
        tenant_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (deleted_at IS NULL)
);

-- 2. Indexes for fast calendar lookup queries
CREATE INDEX IF NOT EXISTS idx_academic_years_tenant_active 
    ON public.academic_years(tenant_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_academic_years_tenant_dates 
    ON public.academic_years(tenant_id, start_date, end_date) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_academic_years_tenant_current
    ON public.academic_years(tenant_id)
    WHERE is_current = true AND deleted_at IS NULL;

-- 2.1 Partial Unique Indexes (prevents duplicate codes/names and multiple current years within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ay_tenant_code 
    ON public.academic_years(tenant_id, code) 
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ay_tenant_name
    ON public.academic_years(tenant_id, name)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ay_tenant_current 
    ON public.academic_years(tenant_id) 
    WHERE is_current = true AND deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (enables composite foreign key verification in batches table)
ALTER TABLE public.academic_years DROP CONSTRAINT IF EXISTS uq_academic_years_tenant_id CASCADE;
ALTER TABLE public.academic_years ADD CONSTRAINT uq_academic_years_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_academic_years_touch_audit ON public.academic_years;
CREATE TRIGGER trg_biu_academic_years_touch_audit
    BEFORE INSERT OR UPDATE ON public.academic_years
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_academic_years_select ON public.academic_years;
CREATE POLICY policy_academic_years_select
    ON public.academic_years
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.academic_years IS 'Academic Years calendar periods per tenant';
COMMENT ON COLUMN public.academic_years.code IS 'Uppercase period identifier code (e.g. AY2026)';
COMMENT ON COLUMN public.academic_years.is_current IS 'Active current calendar flag pointer. 1 AY = Many Terms relationship target';
COMMENT ON COLUMN public.academic_years.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.academic_years.version IS 'Optimistic concurrency control version stamp';
