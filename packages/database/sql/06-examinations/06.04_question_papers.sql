-- ============================================================================
-- SQL File: 06.03_question_papers.sql
-- Domain: Reusable Question Papers
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. A Question Paper is a reusable template of selected questions.
--    Unlike exam_questions which are tied to a specific exam section,
--    a Question Paper can be reused across multiple exams.
-- 2. This decouples question selection from exam scheduling.
--    Flow: Question Bank → Question Paper → Exam
-- 3. One paper can be used by multiple exams (e.g. weekly tests sharing
--    the same paper).
-- 4. Papers have their own versioning to track revisions over time.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_papers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    paper_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    course_id UUID NOT NULL,
    subject_id UUID,
    total_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    published_version INTEGER,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,

    -- Constraints
    CONSTRAINT fk_qp_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_qp_course FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_qp_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_qp_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_qp_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_qp_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_qp_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_qp_code CHECK (length(trim(paper_code)) > 0),
    CONSTRAINT chk_qp_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_qp_total_marks CHECK (total_marks >= 0),
    CONSTRAINT chk_qp_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT chk_qp_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT chk_qp_published_version CHECK (published_version IS NULL OR published_version > 0),
    CONSTRAINT chk_qp_version CHECK (version > 0),

    -- Unique paper code per tenant
    CONSTRAINT uq_qp_code UNIQUE (tenant_id, paper_code)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_qp_tenant_id') THEN
        ALTER TABLE public.question_papers ADD CONSTRAINT uq_qp_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qp_tenant_course ON public.question_papers(tenant_id, course_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qp_tenant_subject ON public.question_papers(tenant_id, subject_id) WHERE subject_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qp_tenant_status ON public.question_papers(tenant_id, status, created_at) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_papers_touch_audit ON public.question_papers;
CREATE TRIGGER trg_bu_question_papers_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_papers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_qp_select ON public.question_papers;
CREATE POLICY policy_qp_select
    ON public.question_papers FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_qp_insert ON public.question_papers;
CREATE POLICY policy_qp_insert
    ON public.question_papers FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_qp_update ON public.question_papers;
CREATE POLICY policy_qp_update
    ON public.question_papers FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.question_papers IS 'Reusable question paper templates — decouples question selection from exam scheduling';
COMMENT ON COLUMN public.question_papers.paper_code IS 'Unique paper code within tenant (e.g. NEET-PHY-001)';
COMMENT ON COLUMN public.question_papers.total_marks IS 'Sum of marks for all questions in the paper';
COMMENT ON COLUMN public.question_papers.duration_minutes IS 'Recommended duration for this paper in minutes';
COMMENT ON COLUMN public.question_papers.status IS 'Lifecycle: DRAFT, PUBLISHED, ARCHIVED';
COMMENT ON COLUMN public.question_papers.version IS 'Optimistic concurrency control version stamp';

-- 8. FK from exams → question_papers (deferred here because exams is created in 06.01 before this table exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_exams_question_paper') THEN
        ALTER TABLE public.exams ADD CONSTRAINT fk_exams_question_paper
            FOREIGN KEY (tenant_id, question_paper_id)
            REFERENCES public.question_papers(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL;
    END IF;
END $$;
