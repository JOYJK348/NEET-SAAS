-- ============================================================================
-- SQL File: 06.01_exams.sql
-- Domain: Master Exam Definition Registry
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "exams" is the root aggregate for the examination bounded context.
-- 2. Composite FKs (tenant_id, *) enforce complete multi-tenant referential safety.
-- 3. publish_status CHECK ensures only PUBLISHED exams carry publication timestamps.
-- 4. Negative marking is opt-in with a configurable default value.
-- 5. published_version + is_locked prevents edits after exam is conducted.
-- 6. Trigger validates tenant alignment across all referenced entities.
-- 7. RLS: Super Admin → All | Staff → tenant-scoped | Student → own exams via registrations.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Academic Context
    course_id UUID NOT NULL,
    batch_id UUID,
    subject_id UUID,
    academic_year_id UUID NOT NULL,
    question_paper_id UUID,

    -- Exam Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_type exam_type_enum NOT NULL DEFAULT 'WEEKLY',
    mode exam_mode_enum NOT NULL DEFAULT 'OFFLINE',

    -- Scoring
    total_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    passing_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    negative_marking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    negative_marking_value DECIMAL(5,2) DEFAULT 0.25,

    -- Scheduling
    duration_minutes INTEGER NOT NULL DEFAULT 180,
    scheduled_start_at TIMESTAMP WITH TIME ZONE,
    scheduled_end_at TIMESTAMP WITH TIME ZONE,

    -- Publishing
    publish_status exam_publish_status_enum NOT NULL DEFAULT 'DRAFT',
    published_by UUID,
    published_at TIMESTAMP WITH TIME ZONE,
    published_from_ip INET,
    published_device VARCHAR(100),
    results_published_at TIMESTAMP WITH TIME ZONE,
    results_published_by UUID,

    -- Settings
    instructions TEXT,
    calculator_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    rough_sheet_allowed BOOLEAN NOT NULL DEFAULT TRUE,

    -- OMR Specific (for offline exams)
    omr_template_id UUID,
    omr_sheet_count INTEGER,

    -- Versioning & Locking
    version INTEGER NOT NULL DEFAULT 1,
    published_version INTEGER,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID,

    -- Status
    status exam_status_enum NOT NULL DEFAULT 'ACTIVE',

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    -- Constraints
    CONSTRAINT fk_exams_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exams_course FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exams_batch FOREIGN KEY (tenant_id, batch_id)
        REFERENCES public.batches(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exams_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- FK fk_exams_question_papers added via ALTER TABLE in 06.04_question_papers.sql after question_papers exists

    CONSTRAINT fk_exams_academic_year FOREIGN KEY (tenant_id, academic_year_id)
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_exams_published_by FOREIGN KEY (published_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exams_results_published_by FOREIGN KEY (results_published_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exams_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exams_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_exams_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness (enables composite FKs from downstream tables)
    CONSTRAINT uq_exams_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_exams_dates CHECK (scheduled_end_at > scheduled_start_at),
    CONSTRAINT chk_exams_marks CHECK (total_marks >= passing_marks AND total_marks > 0),
    CONSTRAINT chk_exams_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_exams_negative_marking CHECK (negative_marking_value >= 0),
    CONSTRAINT chk_exams_omr_sheet_count CHECK (omr_sheet_count IS NULL OR omr_sheet_count > 0),
    CONSTRAINT chk_exams_publish_status CHECK (
        (publish_status NOT IN ('PUBLISHED', 'ARCHIVED') AND published_by IS NULL AND published_at IS NULL)
        OR (publish_status IN ('PUBLISHED', 'ARCHIVED') AND published_by IS NOT NULL AND published_at IS NOT NULL)
    ),
    CONSTRAINT chk_exams_results_publish CHECK (
        (results_published_at IS NULL AND results_published_by IS NULL)
        OR (results_published_at IS NOT NULL AND results_published_by IS NOT NULL)
    ),
    CONSTRAINT chk_exams_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_exams_locked CHECK (
        (is_locked = false AND locked_by IS NULL AND locked_at IS NULL)
        OR (is_locked = true AND locked_by IS NOT NULL AND locked_at IS NOT NULL)
    ),
    CONSTRAINT chk_exams_version CHECK (version > 0),
    CONSTRAINT chk_exams_published_version CHECK (published_version IS NULL OR published_version > 0)
);

-- 2. Idempotent backup: ensures UNIQUE exists even if CREATE TABLE IF NOT EXISTS skipped
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_exams_tenant_id') THEN
        ALTER TABLE public.exams ADD CONSTRAINT uq_exams_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exams_tenant_batch ON public.exams(tenant_id, batch_id, scheduled_start_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exams_tenant_type ON public.exams(tenant_id, exam_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exams_tenant_publish ON public.exams(tenant_id, publish_status, scheduled_start_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exams_tenant_dates ON public.exams(tenant_id, scheduled_start_at, scheduled_end_at) WHERE deleted_at IS NULL;

-- 4. Trigger: validate tenant alignment across batch, subject, and academic_year
CREATE OR REPLACE FUNCTION public.validate_exam_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    course_tenant UUID;
    batch_tenant UUID;
    subject_tenant UUID;
    ay_tenant UUID;
    qp_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT course_tenant
    FROM public.courses WHERE id = NEW.course_id AND deleted_at IS NULL;

    IF course_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: course tenant_id mismatch with exam';
    END IF;

    IF NEW.batch_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT batch_tenant
        FROM public.batches WHERE id = NEW.batch_id AND deleted_at IS NULL;

        IF batch_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: batch tenant_id mismatch with exam';
        END IF;
    END IF;

    IF NEW.subject_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT subject_tenant
        FROM public.subjects WHERE id = NEW.subject_id AND deleted_at IS NULL;

        IF subject_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: subject tenant_id mismatch with exam';
        END IF;
    END IF;

    SELECT tenant_id INTO STRICT ay_tenant
    FROM public.academic_years WHERE id = NEW.academic_year_id AND deleted_at IS NULL;

    IF ay_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: academic_year tenant_id mismatch with exam';
    END IF;

    IF NEW.question_paper_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT qp_tenant
        FROM public.question_papers WHERE id = NEW.question_paper_id AND deleted_at IS NULL;

        IF qp_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: question_paper tenant_id mismatch with exam';
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated course, batch, subject, academic year, or question paper does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_exam_tenant_validation ON public.exams;
CREATE TRIGGER trg_biu_exam_tenant_validation
    BEFORE INSERT OR UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_tenant();

-- 4.1 Audit trigger
DROP TRIGGER IF EXISTS trg_bu_exams_touch_audit ON public.exams;
CREATE TRIGGER trg_bu_exams_touch_audit
    BEFORE INSERT OR UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 5. RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_exams_select ON public.exams;
CREATE POLICY policy_exams_select
    ON public.exams FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                      AND user_type IN ('STAFF'::user_type_enum, 'TUTOR'::user_type_enum)
                      AND deleted_at IS NULL
                )
            )
        )
    );

-- Student/Parent access to exams is granted via a complementary policy
-- created in 06.04_exam_registrations.sql after exam_registrations table exists.

COMMENT ON TABLE public.exams IS 'Master exam definitions for all assessment types (WEEKLY, MONTHLY, GRAND, etc.)';
COMMENT ON COLUMN public.exams.batch_id IS 'Target batch for this exam';
COMMENT ON COLUMN public.exams.exam_type IS 'Classification: WEEKLY, MONTHLY, GRAND, FULL_SYLLABUS, CHAPTER, UNIT, REVISION, PRACTICE, SCHOLARSHIP';
COMMENT ON COLUMN public.exams.mode IS 'Delivery mode: ONLINE, OFFLINE, HYBRID';
COMMENT ON COLUMN public.exams.publish_status IS 'Lifecycle: DRAFT → SCHEDULED → PUBLISHED → ARCHIVED / CANCELLED';
COMMENT ON COLUMN public.exams.negative_marking_value IS 'Default negative marking fraction per wrong answer (e.g. 0.25 for 1/4th)';
COMMENT ON COLUMN public.exams.published_version IS 'Snapshot version locked when exam is published — prevents post-conduct edits';
COMMENT ON COLUMN public.exams.is_locked IS 'When true, exam structure cannot be modified (after students start attempting)';
COMMENT ON COLUMN public.exams.version IS 'Optimistic concurrency control version stamp';
