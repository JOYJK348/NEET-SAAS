-- ============================================================================
-- SQL File: 01.09_course_subjects.sql
-- Domain: Master Core Course Subjects Mapping Bridge
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "course_subjects" functions as a bridge linking subjects to specific courses.
-- 2. Uses composite foreign keys (tenant_id + course_id/subject_id) with ON UPDATE CASCADE
--    to guarantee complete referential safety without orphan records.
-- 3. Configures marks using SMALLINT to support integer grading, reducing size overhead.
-- 4. Unique indexes configured with tenant_id (tenant_id, course_id, subject_id).
-- 5. Removed redundant standalone tenant_id lookup index.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.course_subjects (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    course_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    
    display_order SMALLINT NOT NULL DEFAULT 1,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    
    total_marks SMALLINT NOT NULL DEFAULT 100,
    passing_marks SMALLINT NOT NULL DEFAULT 40,
    credits SMALLINT NOT NULL DEFAULT 0,
    planned_hours SMALLINT NOT NULL DEFAULT 100,
    
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
    CONSTRAINT fk_cs_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Composite foreign keys enforcing tenant safety
    CONSTRAINT fk_cs_course_tenant FOREIGN KEY (tenant_id, course_id) 
        REFERENCES public.courses(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_cs_subject_tenant FOREIGN KEY (tenant_id, subject_id) 
        REFERENCES public.subjects(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_cs_display_order CHECK (display_order > 0),
    CONSTRAINT chk_cs_total_marks CHECK (total_marks > 0),
    CONSTRAINT chk_cs_passing_marks CHECK (passing_marks >= 0),
    CONSTRAINT chk_cs_passing_limit CHECK (passing_marks <= total_marks),
    CONSTRAINT chk_cs_credits CHECK (credits >= 0),
    CONSTRAINT chk_cs_planned_hours CHECK (planned_hours > 0),
    CONSTRAINT chk_cs_version CHECK (version > 0)
);

-- 2. Indexes for fast lookup search and UI ordering dropdowns (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_cs_tenant_course_active 
    ON public.course_subjects(tenant_id, course_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cs_tenant_course_display 
    ON public.course_subjects(tenant_id, course_id, display_order) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cs_tenant_subject_lookup 
    ON public.course_subjects(tenant_id, subject_id) 
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream mapping tables)
ALTER TABLE public.course_subjects DROP CONSTRAINT IF EXISTS uq_course_subjects_tenant_id CASCADE;
ALTER TABLE public.course_subjects ADD CONSTRAINT uq_course_subjects_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Index for Soft Deletes (prevents duplicate mappings within the course)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_cs_tenant_course_subject 
    ON public.course_subjects(tenant_id, course_id, subject_id) 
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_course_subjects_touch_audit ON public.course_subjects;
CREATE TRIGGER trg_biu_course_subjects_touch_audit
    BEFORE INSERT OR UPDATE ON public.course_subjects
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_course_subjects_select ON public.course_subjects;
CREATE POLICY policy_course_subjects_select
    ON public.course_subjects
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.course_subjects IS 'Bridge table mapping subjects to specific academic courses';
COMMENT ON COLUMN public.course_subjects.display_order IS 'Custom order for course syllabus dropdown sorting';
COMMENT ON COLUMN public.course_subjects.is_mandatory IS 'Flag indicating if the subject is mandatory for this course';
COMMENT ON COLUMN public.course_subjects.total_marks IS 'Total course score weighting allocated to this subject (Integer)';
COMMENT ON COLUMN public.course_subjects.passing_marks IS 'Passing threshold score weighting allocated to this subject (Integer)';
COMMENT ON COLUMN public.course_subjects.credits IS 'Academic credits weight mapping for the subject';
COMMENT ON COLUMN public.course_subjects.planned_hours IS 'Planned teaching hours allocation';
COMMENT ON COLUMN public.course_subjects.version IS 'Optimistic concurrency control version stamp';
