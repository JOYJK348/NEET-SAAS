-- ============================================================================
-- SQL File: 01.01_institutes.sql
-- Domain: Master Core Institute Tenant Registration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "institutes" functions as the single-tenant root mapping table.
-- 2. Added code regex format checks ('^[A-Z0-9_]+$') and slug validation.
-- 3. Enforces unique email constraints.
-- 4. Uses the global touch_audit_columns trigger to populate stamps.
-- 5. Ensured execution safety (DROP IF EXISTS triggers/policies) for rerun safety.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.institutes (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    code VARCHAR(20) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    
    email email_address NOT NULL,
    phone phone_number NOT NULL,
    website VARCHAR(255) NULL,
    
    logo_file_id UUID NULL, -- References sys_file_versions.id (FK added in system migration step)
    
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    currency currency_code NOT NULL DEFAULT 'INR',
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT uq_institutes_code UNIQUE (code),
    CONSTRAINT uq_institutes_slug UNIQUE (slug),
    CONSTRAINT uq_institutes_email UNIQUE (email),
    
    CONSTRAINT chk_institutes_code_format CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT chk_institutes_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_institutes_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT chk_institutes_version CHECK (version > 0)
);

-- 2. Indexes for fast status checks
CREATE INDEX IF NOT EXISTS idx_institutes_status ON public.institutes(status) WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_bu_institutes_touch_audit ON public.institutes;
CREATE TRIGGER trg_bu_institutes_touch_audit
    BEFORE INSERT OR UPDATE ON public.institutes
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_institutes_select ON public.institutes;
CREATE POLICY policy_institutes_select
    ON public.institutes
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- 5. Statistics Collection Analyzer
ANALYZE public.institutes;

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.institutes IS 'Master root tenant registration directory';
COMMENT ON COLUMN public.institutes.code IS 'Immutable short uppercase identifier code';
COMMENT ON COLUMN public.institutes.slug IS 'Domain url slug routing identifier';
COMMENT ON COLUMN public.institutes.status IS 'Active state constraints';
COMMENT ON COLUMN public.institutes.version IS 'Optimistic concurrency control version stamp';
