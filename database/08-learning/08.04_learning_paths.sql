-- ============================================================================
-- SQL File: 08.04_learning_paths.sql
-- Domain: Structured Learning Paths (Course Planner)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Learning paths define structured course plans (e.g. "30 Day NEET Crash
--    Course", "Biology Mastery", "Physics Revision", "Topper Plan").
-- 2. Contains only path-level metadata. Materials are mapped via 08.05.
-- 3. Supports sequential unlock and drip learning through the bridge table.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty question_difficulty_enum,
    estimated_days INTEGER,
    status learning_path_status_enum NOT NULL DEFAULT 'ACTIVE',

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
    CONSTRAINT fk_learning_paths_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_learning_paths_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_paths_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_paths_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_learning_paths_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_path_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_path_estimated_days CHECK (estimated_days IS NULL OR estimated_days > 0),
    CONSTRAINT chk_path_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_learning_paths_tenant_id') THEN
        ALTER TABLE public.learning_paths ADD CONSTRAINT uq_learning_paths_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lp_tenant_status ON public.learning_paths(tenant_id, status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lp_tenant_difficulty ON public.learning_paths(tenant_id, difficulty) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_learning_paths_touch_audit ON public.learning_paths;
CREATE TRIGGER trg_bu_learning_paths_touch_audit
    BEFORE INSERT OR UPDATE ON public.learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_lp_select ON public.learning_paths;
CREATE POLICY policy_lp_select
    ON public.learning_paths FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_lp_insert ON public.learning_paths;
CREATE POLICY policy_lp_insert
    ON public.learning_paths FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_lp_update ON public.learning_paths;
CREATE POLICY policy_lp_update
    ON public.learning_paths FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.learning_paths IS 'Structured learning paths / course planners — e.g. 30 Day NEET Crash Course, Physics Revision';
COMMENT ON COLUMN public.learning_paths.difficulty IS 'Overall difficulty level of the learning path';
COMMENT ON COLUMN public.learning_paths.estimated_days IS 'Number of days estimated to complete this path';
COMMENT ON COLUMN public.learning_paths.status IS 'Lifecycle: ACTIVE, INACTIVE, ARCHIVED';
COMMENT ON COLUMN public.learning_paths.version IS 'Optimistic concurrency control version stamp';
