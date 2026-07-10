-- ============================================================================
-- SQL File: 01.10_chapters.sql
-- Domain: Master Core Syllabus Chapters Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "chapters" belong to specific "course_subjects" mappings to allow custom course structures.
-- 2. Uses composite foreign key (tenant_id, course_subject_id) with ON UPDATE CASCADE
--    to prevent cross-tenant/course references.
-- 3. Added "estimated_sessions" SMALLINT for timetable scheduler logic.
-- 4. Scopes unique name/short_name validation case-insensitively using partial unique lower(trim()) indexes.
-- 5. Extended code identifier lengths to VARCHAR(30) to allow long structured short codes.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    course_subject_id UUID NOT NULL,
    
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(20) NULL,
    description TEXT NULL,
    
    planned_hours SMALLINT NOT NULL DEFAULT 10,
    estimated_sessions SMALLINT NOT NULL DEFAULT 8,
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
    CONSTRAINT fk_chapters_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Composite foreign key enforcing tenant safety
    CONSTRAINT fk_chapters_course_subject_tenant FOREIGN KEY (tenant_id, course_subject_id) 
        REFERENCES public.course_subjects(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_chapters_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_chapters_short_name_length CHECK (short_name IS NULL OR length(trim(short_name)) > 0),
    CONSTRAINT chk_chapters_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]{1,29}$'),
    CONSTRAINT chk_chapters_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_chapters_planned_hours CHECK (planned_hours BETWEEN 1 AND 1000),
    CONSTRAINT chk_chapters_estimated_sessions CHECK (estimated_sessions BETWEEN 1 AND 500),
    CONSTRAINT chk_chapters_display_order CHECK (display_order > 0),
    CONSTRAINT chk_chapters_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search and ordering lookups (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_chapters_tenant_cs_active 
    ON public.chapters(tenant_id, course_subject_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_tenant_cs_display 
    ON public.chapters(tenant_id, course_subject_id, display_order) 
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream topic tables)
ALTER TABLE public.chapters DROP CONSTRAINT IF EXISTS uq_chapters_tenant_id CASCADE;
ALTER TABLE public.chapters ADD CONSTRAINT uq_chapters_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same course subject)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_chapters_tenant_cs_code 
    ON public.chapters(tenant_id, course_subject_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_chapters_tenant_cs_name_lower
    ON public.chapters(tenant_id, course_subject_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- Case-insensitive short_name unique index using lower(trim()) mapping checks (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_chapters_tenant_cs_short_name_lower
    ON public.chapters(tenant_id, course_subject_id, lower(trim(short_name)))
    WHERE deleted_at IS NULL AND short_name IS NOT NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_chapters_touch_audit ON public.chapters;
CREATE TRIGGER trg_biu_chapters_touch_audit
    BEFORE INSERT OR UPDATE ON public.chapters
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_chapters_select ON public.chapters;
CREATE POLICY policy_chapters_select
    ON public.chapters
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.chapters IS 'Academic syllabus chapters configurations directory per course subject mapping';
COMMENT ON COLUMN public.chapters.code IS 'Uppercase chapter identifier code (e.g. THERMO, CELL)';
COMMENT ON COLUMN public.chapters.short_name IS 'Short uppercase abbreviation code (e.g. THRM)';
COMMENT ON COLUMN public.chapters.planned_hours IS 'Planned teaching hours allocation';
COMMENT ON COLUMN public.chapters.estimated_sessions IS 'Estimated lecture sessions count';
COMMENT ON COLUMN public.chapters.display_order IS 'Sort order tracking sequence';
COMMENT ON COLUMN public.chapters.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.chapters.version IS 'Optimistic concurrency control version stamp';
