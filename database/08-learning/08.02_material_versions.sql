-- ============================================================================
-- SQL File: 08.02_material_versions.sql
-- Domain: Material Version History (Append-Only Immutable Ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Append-ONLY — never UPDATE or DELETE rows. Content should never be overwritten.
-- 2. Each edit to a learning material creates a new version row with full JSONB snapshot.
-- 3. change_reason provides audit trail for academic compliance.
-- 4. No deleted_at — records are immutable and permanent.
-- 5. No updated_at — only created_at for immutable audit.
-- 6. No version column — version field in table tracks version number.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.material_versions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    material_id UUID NOT NULL,
    version INTEGER NOT NULL,
    material_snapshot JSONB NOT NULL,
    change_reason TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    -- Constraints
    CONSTRAINT fk_material_versions_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_material_versions_material FOREIGN KEY (tenant_id, material_id)
        REFERENCES public.learning_materials(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_material_versions_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    -- Composite Uniqueness
    CONSTRAINT uq_material_versions_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_material_version_number CHECK (version > 0),
    CONSTRAINT chk_material_version_reason CHECK (length(trim(change_reason)) > 0),

    -- One version per material per version number
    CONSTRAINT uq_material_version_number UNIQUE (material_id, version)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_material_versions_tenant_id') THEN
        ALTER TABLE public.material_versions ADD CONSTRAINT uq_material_versions_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_material_versions_material ON public.material_versions(material_id, version);
CREATE INDEX IF NOT EXISTS idx_material_versions_tenant ON public.material_versions(tenant_id, material_id, version);
CREATE INDEX IF NOT EXISTS idx_material_versions_created ON public.material_versions(tenant_id, created_at);

-- RLS
ALTER TABLE public.material_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_material_versions_select ON public.material_versions;
CREATE POLICY policy_material_versions_select
    ON public.material_versions FOR SELECT TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_material_versions_insert ON public.material_versions;
CREATE POLICY policy_material_versions_insert
    ON public.material_versions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.material_versions IS 'Append-only immutable version history for learning materials — never UPDATE or DELETE';
COMMENT ON COLUMN public.material_versions.material_snapshot IS 'Full JSONB snapshot of the learning material at this version (all columns + metadata)';
COMMENT ON COLUMN public.material_versions.change_reason IS 'Audit reason for the change (e.g. Content update, Error fix, Curriculum revision)';
