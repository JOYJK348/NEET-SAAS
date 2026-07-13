-- ============================================================================
-- SQL File: 08.05_learning_path_materials.sql
-- Domain: Learning Path → Material Bridge (Sequenced Mapping)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Bridge table mapping learning paths to materials in sequence.
-- 2. display_order controls material sequencing within the path.
-- 3. unlock_after_days enables drip learning and sequential unlock.
-- 4. is_mandatory flag for required vs optional materials.
-- 5. Composite FKs ensure both path and material belong to the same tenant.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.learning_path_materials (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    path_id UUID NOT NULL,
    material_id UUID NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    unlock_after_days INTEGER NOT NULL DEFAULT 0,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,

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
    CONSTRAINT fk_lpm_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_lpm_path FOREIGN KEY (tenant_id, path_id)
        REFERENCES public.learning_paths(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_lpm_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_lpm_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lpm_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_lpm_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_lpm_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_lpm_display_order CHECK (display_order > 0),
    CONSTRAINT chk_lpm_unlock_days CHECK (unlock_after_days >= 0),
    CONSTRAINT chk_lpm_version CHECK (version > 0),

    -- One material per path only once
    CONSTRAINT uq_lpm_path_material UNIQUE (path_id, material_id),

    -- Unique display order within a path
    CONSTRAINT uq_lpm_path_order UNIQUE (path_id, display_order)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_lpm_tenant_id') THEN
        ALTER TABLE public.learning_path_materials ADD CONSTRAINT uq_lpm_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lpm_path ON public.learning_path_materials(path_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lpm_material ON public.learning_path_materials(material_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lpm_tenant ON public.learning_path_materials(tenant_id, path_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lpm_mandatory ON public.learning_path_materials(path_id, is_mandatory) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_lpm_touch_audit ON public.learning_path_materials;
CREATE TRIGGER trg_bu_lpm_touch_audit
    BEFORE INSERT OR UPDATE ON public.learning_path_materials
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.learning_path_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_lpm_select ON public.learning_path_materials;
CREATE POLICY policy_lpm_select
    ON public.learning_path_materials FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_lpm_insert ON public.learning_path_materials;
CREATE POLICY policy_lpm_insert
    ON public.learning_path_materials FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_lpm_update ON public.learning_path_materials;
CREATE POLICY policy_lpm_update
    ON public.learning_path_materials FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.learning_path_materials IS 'Bridge table mapping learning paths to materials with sequencing and unlock rules';
COMMENT ON COLUMN public.learning_path_materials.display_order IS 'Order of material within the learning path (1, 2, 3, ...)';
COMMENT ON COLUMN public.learning_path_materials.unlock_after_days IS 'Days after path start before this material becomes accessible (drip learning)';
COMMENT ON COLUMN public.learning_path_materials.is_mandatory IS 'True if this material is required to complete the path';
COMMENT ON COLUMN public.learning_path_materials.version IS 'Optimistic concurrency control version stamp';
