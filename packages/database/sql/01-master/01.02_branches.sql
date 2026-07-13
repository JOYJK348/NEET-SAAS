-- ============================================================================
-- SQL File: 01.02_branches.sql
-- Domain: Master Core Branches Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Added "branch_type" check constraints (HEAD_OFFICE, CAMPUS, FRANCHISE, ONLINE).
-- 2. Added "timezone" field to handle multi-region branch calendars independently.
-- 3. Implemented name length validation checks: CHECK(length(trim(name)) > 0).
-- 4. Added index on (tenant_id, name) to accelerate drop-down ordering selects.
-- 5. Tightened status datatype column size constraints (VARCHAR(20)).
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(20) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    
    email email_address NOT NULL,
    phone phone_number NOT NULL,
    
    branch_type branch_type NOT NULL DEFAULT 'CAMPUS',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_branches_tenant FOREIGN KEY (tenant_id) REFERENCES public.institutes(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_branches_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_branches_display_name_length CHECK (length(trim(display_name)) > 0),
    
    CONSTRAINT chk_branches_code_format CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT chk_branches_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_branches_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT chk_branches_version CHECK (version > 0),
    
    CONSTRAINT uq_branches_tenant_id UNIQUE (tenant_id, id)
);

-- 2. Indexes for fast tenant search, dashboards, and ordering lookups
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON public.branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_tenant_status ON public.branches(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_branches_tenant_name ON public.branches(tenant_id, name) WHERE deleted_at IS NULL;

-- 2.1 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/slugs/emails within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_branches_tenant_code 
    ON public.branches(tenant_id, code) 
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_branches_tenant_slug 

    ON public.branches(tenant_id, slug) 
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_branches_tenant_email 
    ON public.branches(tenant_id, email) 
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_bu_branches_touch_audit ON public.branches;
CREATE TRIGGER trg_bu_branches_touch_audit
    BEFORE INSERT OR UPDATE ON public.branches
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_branches_select ON public.branches;
CREATE POLICY policy_branches_select
    ON public.branches
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Statistics Collection Analyzer
ANALYZE public.branches;

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.branches IS 'Master branch configurations directory per tenant';
COMMENT ON COLUMN public.branches.code IS 'Short uppercase code unique within the tenant (e.g. CHN, MDU)';
COMMENT ON COLUMN public.branches.slug IS 'URL slug identifier unique within the tenant (e.g. chennai)';
COMMENT ON COLUMN public.branches.branch_type IS 'Operational classification for branch nodes';
COMMENT ON COLUMN public.branches.status IS 'Active state constraints';
COMMENT ON COLUMN public.branches.version IS 'Optimistic concurrency control version stamp';
