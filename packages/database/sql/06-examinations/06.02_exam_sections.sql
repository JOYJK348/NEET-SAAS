-- ============================================================================
-- SQL File: 06.02_exam_sections.sql
-- Domain: Exam Sections (Physics, Chemistry, Botany, Zoology for NEET)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "exam_sections" maps NEET-style subject partitions within an exam.
-- 2. Cascade deletes from parent exam — sections are not shared across exams.
-- 3. Optional duration_minutes allows per-section timing for sectional tests.
-- 4. Composite FK ensures section and exam share the same tenant.
-- 5. RLS inherits exam isolation; sections are only accessible via parent exam.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exam_sections (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Parent Exam
    exam_id UUID NOT NULL,

    -- Section Details
    name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    description TEXT,

    -- Scoring
    total_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    question_count INTEGER NOT NULL DEFAULT 0,
    marks_per_question DECIMAL(5,2) NOT NULL DEFAULT 4.00,
    negative_marks_per_question DECIMAL(5,2) NOT NULL DEFAULT 1.00,

    -- Optional Duration Override
    duration_minutes INTEGER,

    -- Subject Mapping
    subject_id UUID,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_exam_sections_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exam_sections_exam FOREIGN KEY (tenant_id, exam_id)
        REFERENCES public.exams(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_exam_sections_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_sections_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_sections_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exam_sections_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exam_sections_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_section_order CHECK (display_order > 0),
    CONSTRAINT chk_section_marks CHECK (total_marks >= 0),
    CONSTRAINT chk_section_question_count CHECK (question_count >= 0),
    CONSTRAINT chk_section_marks_per_q CHECK (marks_per_question > 0),
    CONSTRAINT chk_section_negative_marks CHECK (negative_marks_per_question >= 0),
    CONSTRAINT chk_section_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT chk_section_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_section_version CHECK (version > 0)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exam_sections_tenant_id') THEN
        ALTER TABLE public.exam_sections ADD CONSTRAINT uq_exam_sections_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_sections_exam ON public.exam_sections(exam_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_sections_tenant_exam ON public.exam_sections(tenant_id, exam_id, display_order) WHERE deleted_at IS NULL;
-- 4. Trigger: validate tenant alignment

CREATE OR REPLACE FUNCTION public.validate_exam_section_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    exam_tenant UUID;
    subject_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT exam_tenant
    FROM public.exams WHERE id = NEW.exam_id AND deleted_at IS NULL;

    IF exam_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch between exam and section';
    END IF;

    IF NEW.subject_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT subject_tenant
        FROM public.subjects WHERE id = NEW.subject_id AND deleted_at IS NULL;

        IF subject_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: subject tenant_id mismatch with exam section';
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated exam or subject does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_section_tenant_validation ON public.exam_sections;
CREATE TRIGGER trg_biu_exam_section_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exam_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_section_tenant();

-- 4.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exam_sections_touch_audit ON public.exam_sections;
CREATE TRIGGER trg_bu_exam_sections_touch_audit
    BEFORE INSERT OR UPDATE ON public.exam_sections
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 5. RLS
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exam_sections_select ON public.exam_sections;
CREATE POLICY policy_exam_sections_select
    ON public.exam_sections FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.exam_sections IS 'NEET-style exam sections (Physics, Chemistry, Botany, Zoology)';
COMMENT ON COLUMN public.exam_sections.marks_per_question IS 'Default marks awarded per correct question in this section';
COMMENT ON COLUMN public.exam_sections.negative_marks_per_question IS 'Default negative marks deducted per wrong answer in this section';
COMMENT ON COLUMN public.exam_sections.duration_minutes IS 'Optional per-section time limit override';
COMMENT ON COLUMN public.exam_sections.version IS 'Optimistic concurrency control version stamp';
