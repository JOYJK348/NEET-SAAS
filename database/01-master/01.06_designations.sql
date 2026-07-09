-- ============================================================================
-- SQL File: 01.06_designations.sql
-- Domain: Master Core Designations Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "designations" are defined globally per tenant to enable cross-branch mapping.
-- 2. Scopes unique name validation case-insensitively using partial unique lower indexes.
-- 3. Configures composite display-order sorting index for fast dropdown selects.
-- 4. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.designations (
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
    CONSTRAINT fk_designations_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_designations_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_designations_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT chk_designations_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_designations_display_order CHECK (display_order > 0),
    CONSTRAINT chk_designations_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search and ordering lookups
CREATE INDEX IF NOT EXISTS idx_designations_tenant_active 
    ON public.designations(tenant_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_designations_tenant_display 
    ON public.designations(tenant_id, display_order) 
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in mapping tables if needed)
ALTER TABLE public.designations DROP CONSTRAINT IF EXISTS uq_designations_tenant_id;
ALTER TABLE public.designations ADD CONSTRAINT uq_designations_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_designations_tenant_code 
    ON public.designations(tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower() mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_designations_tenant_name_lower
    ON public.designations(tenant_id, lower(name))
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_designations_touch_audit ON public.designations;
CREATE TRIGGER trg_biu_designations_touch_audit
    BEFORE INSERT OR UPDATE ON public.designations
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_designations_select ON public.designations;
CREATE POLICY policy_designations_select
    ON public.designations
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.designations IS 'Global functional designations catalog per tenant';
COMMENT ON COLUMN public.designations.code IS 'Uppercase designation identifier code (e.g. LECT, HR_MGR)';
COMMENT ON COLUMN public.designations.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.designations.is_system IS 'Flag indicating structural system seed record';
COMMENT ON COLUMN public.designations.version IS 'Optimistic concurrency control version stamp';
