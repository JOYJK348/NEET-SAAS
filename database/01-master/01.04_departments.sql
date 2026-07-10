-- ============================================================================
-- SQL File: 01.04_departments.sql
-- Domain: Master Core Departments Configurations
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "departments" is defined at the global tenant level (institutes.id).
-- 2. Scopes unique name validation case-insensitively using partial unique lower indexes.
-- 3. Added "is_system" boolean to prevent deletion of critical seed records.
-- 4. Added "display_order" for customized UI dropdown positions.
-- 5. Retained "uq_departments_tenant_id" to allow composite FK validation checking
--    in the branch mapping bridge table, ensuring tenant-safe joins.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    display_order SMALLINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES public.institutes(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_departments_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_departments_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT chk_departments_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_departments_display_order CHECK (display_order > 0),
    CONSTRAINT chk_departments_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search and ordering lookups
CREATE INDEX IF NOT EXISTS idx_departments_tenant_active 
    ON public.departments(tenant_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_departments_tenant_name
    ON public.departments(tenant_id, name) 
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in join tables)
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS uq_departments_tenant_id CASCADE;
ALTER TABLE public.departments ADD CONSTRAINT uq_departments_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_departments_tenant_code 
    ON public.departments(tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower() mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_departments_tenant_name_lower
    ON public.departments(tenant_id, lower(name))
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_departments_touch_audit ON public.departments;
CREATE TRIGGER trg_biu_departments_touch_audit
    BEFORE INSERT OR UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_departments_select ON public.departments;
CREATE POLICY policy_departments_select
    ON public.departments
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.departments IS 'Global functional departments catalog per tenant';
COMMENT ON COLUMN public.departments.code IS 'Uppercase department identifier code (e.g. ACAD, HR)';
COMMENT ON COLUMN public.departments.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.departments.is_system IS 'Flag indicating structural system seed record';
COMMENT ON COLUMN public.departments.version IS 'Optimistic concurrency control version stamp';
