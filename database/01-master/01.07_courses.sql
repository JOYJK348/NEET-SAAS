-- ============================================================================
-- SQL File: 01.07_courses.sql
-- Domain: Master Core Courses Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "courses" is defined at the global tenant level (institutes.id).
-- 2. Added "course_type" classification check constraints (REGULAR, CRASH, FOUNDATION, REPEATER, ONLINE, HYBRID).
-- 3. Constrained duration_months to a realistic range (1 to 120 months).
-- 4. Scopes unique name validation case-insensitively using partial unique lower(trim()) indexes.
-- 5. display_name set to optional nullable field.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    display_name VARCHAR(100) NULL,
    description TEXT NULL,
    
    course_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    duration_months SMALLINT NOT NULL DEFAULT 12,
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
    CONSTRAINT fk_courses_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_courses_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_courses_display_name_length CHECK (display_name IS NULL OR length(trim(display_name)) > 0),
    CONSTRAINT chk_courses_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]{1,19}$'),
    CONSTRAINT chk_courses_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_courses_type CHECK (course_type IN ('REGULAR', 'CRASH', 'FOUNDATION', 'REPEATER', 'ONLINE', 'HYBRID')),
    CONSTRAINT chk_courses_duration CHECK (duration_months BETWEEN 1 AND 120),
    CONSTRAINT chk_courses_display_order CHECK (display_order > 0),
    CONSTRAINT chk_courses_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search, active listings, and ordering lookups
CREATE INDEX IF NOT EXISTS idx_courses_tenant_active 
    ON public.courses(tenant_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_courses_tenant_display 
    ON public.courses(tenant_id, display_order) 
    WHERE deleted_at IS NULL;

-- Index to accelerate tenant search queries ordering by name
CREATE INDEX IF NOT EXISTS idx_courses_tenant_search_name
    ON public.courses(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in mapping tables)
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS uq_courses_tenant_id CASCADE;
ALTER TABLE public.courses ADD CONSTRAINT uq_courses_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_courses_tenant_code 
    ON public.courses(tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_courses_tenant_name_lower
    ON public.courses(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_courses_touch_audit ON public.courses;
CREATE TRIGGER trg_biu_courses_touch_audit
    BEFORE INSERT OR UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_courses_select ON public.courses;
CREATE POLICY policy_courses_select
    ON public.courses
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.courses IS 'Master academic courses directory per tenant';
COMMENT ON COLUMN public.courses.code IS 'Uppercase course identifier code (e.g. NEET_2YR, JEE_CRASH)';
COMMENT ON COLUMN public.courses.duration_months IS 'Course syllabus mapped duration in calendar months';
COMMENT ON COLUMN public.courses.course_type IS 'Operational classification categorization for course layouts';
COMMENT ON COLUMN public.courses.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.courses.version IS 'Optimistic concurrency control version stamp';
