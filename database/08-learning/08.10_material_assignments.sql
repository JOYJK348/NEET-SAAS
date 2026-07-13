-- ============================================================================
-- SQL File: 08.10_material_assignments.sql
-- Domain: Material Assignments (Homework Linked to Learning Content)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Assignments are linked to specific learning materials.
--    "Read PDF → Watch Video → Complete Assignment" workflow.
-- 2. Can reference question bank questions for MCQ-based assignments.
-- 3. submission_type defines how students submit (TEXT, FILE, MCQ, BOTH).
-- 4. Separate from exam_assignments — these are material/homework assignments.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.material_assignments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    material_id UUID NOT NULL,
    question_bank_id UUID,
    due_date TIMESTAMP WITH TIME ZONE,
    marks DECIMAL(5,2),
    submission_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    instructions TEXT,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_ma_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_ma_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_ma_question_bank FOREIGN KEY (tenant_id, question_bank_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ma_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ma_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_ma_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_ma_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_ma_marks CHECK (marks IS NULL OR marks > 0),
    CONSTRAINT chk_ma_submission_type CHECK (submission_type IN ('TEXT', 'FILE', 'MCQ', 'BOTH')),
    CONSTRAINT chk_ma_version CHECK (version > 0),

    -- One assignment per material
    CONSTRAINT uq_ma_material UNIQUE (material_id)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_ma_tenant_id') THEN
        ALTER TABLE public.material_assignments ADD CONSTRAINT uq_ma_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ma_material ON public.material_assignments(material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ma_tenant ON public.material_assignments(tenant_id, material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ma_due_date ON public.material_assignments(tenant_id, due_date) WHERE due_date IS NOT NULL AND deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_ma_touch_audit ON public.material_assignments;
CREATE TRIGGER trg_bu_ma_touch_audit
    BEFORE INSERT OR UPDATE ON public.material_assignments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.material_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_ma_select ON public.material_assignments;
CREATE POLICY policy_ma_select
    ON public.material_assignments FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_ma_insert ON public.material_assignments;
CREATE POLICY policy_ma_insert
    ON public.material_assignments FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_ma_update ON public.material_assignments;
CREATE POLICY policy_ma_update
    ON public.material_assignments FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.material_assignments IS 'Assignments linked to learning materials — supports TEXT, FILE, MCQ submission types. Can reference question bank.';
COMMENT ON COLUMN public.material_assignments.question_bank_id IS 'Optional reference to questions from the question bank for MCQ-type assignments';
COMMENT ON COLUMN public.material_assignments.due_date IS 'Assignment submission deadline';
COMMENT ON COLUMN public.material_assignments.marks IS 'Maximum marks for the assignment';
COMMENT ON COLUMN public.material_assignments.submission_type IS 'Allowed submission format: TEXT, FILE, MCQ, BOTH';
COMMENT ON COLUMN public.material_assignments.instructions IS 'Assignment instructions provided to students';
COMMENT ON COLUMN public.material_assignments.version IS 'Optimistic concurrency control version stamp';
