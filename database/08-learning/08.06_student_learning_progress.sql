-- ============================================================================
-- SQL File: 08.06_student_learning_progress.sql
-- Domain: Student Learning Progress Tracking ⭐⭐⭐⭐⭐
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Most important analytics table in the learning context.
--    Tracks exactly where each student is in every material.
-- 2. Never calculate progress on-the-fly — always update this table.
-- 3. One row per student per material — enforced by UNIQUE constraint.
-- 4. progress_percentage (0-100) for completion tracking.
-- 5. last_position stores last page / video timestamp for resume.
-- 6. time_spent_seconds accumulates across sessions.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.student_learning_progress (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    student_id UUID NOT NULL,
    material_id UUID NOT NULL,

    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_position INTEGER,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    status progress_status_enum NOT NULL DEFAULT 'NOT_STARTED',

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
    CONSTRAINT fk_slp_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_slp_student FOREIGN KEY (student_id)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_slp_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_slp_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_slp_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_slp_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_slp_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_slp_progress CHECK (progress_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_slp_time_spent CHECK (time_spent_seconds >= 0),
    CONSTRAINT chk_slp_last_position CHECK (last_position IS NULL OR last_position >= 0),
    CONSTRAINT chk_slp_version CHECK (version > 0),

    -- One progress record per student per material
    CONSTRAINT uq_slp_student_material UNIQUE (student_id, material_id)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_slp_tenant_id') THEN
        ALTER TABLE public.student_learning_progress ADD CONSTRAINT uq_slp_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slp_student ON public.student_learning_progress(student_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_slp_material ON public.student_learning_progress(material_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_slp_tenant ON public.student_learning_progress(tenant_id, student_id, material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_slp_progress ON public.student_learning_progress(tenant_id, progress_percentage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_slp_completed ON public.student_learning_progress(tenant_id, completed_at) WHERE completed_at IS NOT NULL AND deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_slp_touch_audit ON public.student_learning_progress;
CREATE TRIGGER trg_bu_slp_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.student_learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_slp_select ON public.student_learning_progress;
CREATE POLICY policy_slp_select
    ON public.student_learning_progress FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
            AND (
                student_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                      AND user_type IN ('STAFF'::user_type_enum, 'TUTOR'::user_type_enum)
                      AND deleted_at IS NULL
                )
            )
        )
    );

DROP POLICY IF EXISTS policy_slp_insert ON public.student_learning_progress;
CREATE POLICY policy_slp_insert
    ON public.student_learning_progress FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_slp_update ON public.student_learning_progress;
CREATE POLICY policy_slp_update
    ON public.student_learning_progress FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.student_learning_progress IS '⭐⭐⭐⭐⭐ Student learning progress analytics — one row per student per material. Never calculate on-the-fly.';
COMMENT ON COLUMN public.student_learning_progress.progress_percentage IS 'Completion percentage (0.00 to 100.00)';
COMMENT ON COLUMN public.student_learning_progress.last_position IS 'Last position in the material (page number for PDF, seconds for video)';
COMMENT ON COLUMN public.student_learning_progress.time_spent_seconds IS 'Total time spent on this material across all sessions';
COMMENT ON COLUMN public.student_learning_progress.status IS 'Progress state: NOT_STARTED, IN_PROGRESS, COMPLETED';
COMMENT ON COLUMN public.student_learning_progress.version IS 'Optimistic concurrency control version stamp';
