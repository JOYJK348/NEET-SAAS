-- ============================================================================
-- SQL File: 01.08_subjects.sql
-- Domain: Master Core Subjects Configurations
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "subjects" are defined globally per tenant to enable cross-course mapping.
-- 2. Added "short_name" abbreviation constraints for UI schedules grids.
-- 3. Configured "subject_type" check options (CORE, ELECTIVE, LANGUAGE, LAB).
-- 4. Scopes unique name validation case-insensitively using partial unique lower(trim()) indexes.
-- 5. Added composite tenant-scoped indexes to maximize index-only lookup queries.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    display_name VARCHAR(100) NULL,
    description TEXT NULL,
    
    subject_type VARCHAR(20) NOT NULL DEFAULT 'CORE',
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
    CONSTRAINT fk_subjects_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_subjects_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_subjects_short_name_length CHECK (length(trim(short_name)) > 0),
    CONSTRAINT chk_subjects_display_name_length CHECK (display_name IS NULL OR length(trim(display_name)) > 0),
    CONSTRAINT chk_subjects_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]{1,19}$'),
    CONSTRAINT chk_subjects_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_subjects_type CHECK (subject_type IN ('CORE', 'ELECTIVE', 'LANGUAGE', 'LAB')),
    CONSTRAINT chk_subjects_display_order CHECK (display_order > 0),
    CONSTRAINT chk_subjects_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search, active listings, and ordering lookups
CREATE INDEX IF NOT EXISTS idx_subjects_tenant_active 
    ON public.subjects(tenant_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subjects_tenant_display 
    ON public.subjects(tenant_id, display_order) 
    WHERE deleted_at IS NULL;

-- Index to accelerate tenant search queries ordering by name dynamically
CREATE INDEX IF NOT EXISTS idx_subjects_tenant_search_name
    ON public.subjects(tenant_id, is_active, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in mapping tables)
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS uq_subjects_tenant_id CASCADE;
ALTER TABLE public.subjects ADD CONSTRAINT uq_subjects_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_subjects_tenant_code 
    ON public.subjects(tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_subjects_tenant_name_lower
    ON public.subjects(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_subjects_touch_audit ON public.subjects;
CREATE TRIGGER trg_biu_subjects_touch_audit
    BEFORE INSERT OR UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_subjects_select ON public.subjects;
CREATE POLICY policy_subjects_select
    ON public.subjects
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.subjects IS 'Master academic subjects directory per tenant';
COMMENT ON COLUMN public.subjects.code IS 'Uppercase subject identifier code (e.g. PHY, CHEM, BIO)';
COMMENT ON COLUMN public.subjects.short_name IS 'Short uppercase abbreviation code (e.g. PHY)';
COMMENT ON COLUMN public.subjects.subject_type IS 'Structural classification mapping categories (e.g. CORE)';
COMMENT ON COLUMN public.subjects.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.subjects.version IS 'Optimistic concurrency control version stamp';
