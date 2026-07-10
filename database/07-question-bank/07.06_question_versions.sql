-- ============================================================================
-- SQL File: 07.06_question_versions.sql
-- Domain: Question Version History (Append-Only Immutable Ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Append-ONLY — never UPDATE or DELETE rows. Questions should never be overwritten.
-- 2. Each edit to a question creates a new version row with full JSONB snapshot.
-- 3. change_reason provides audit trail for academic compliance.
-- 4. No deleted_at — records are immutable and permanent.
-- 5. No updated_at — only created_at for immutable audit.
-- 6. No version column — version field in table tracks version number.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_versions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    question_id UUID NOT NULL,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    change_reason TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    -- Constraints
    CONSTRAINT fk_question_versions_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_versions_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_versions_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    -- Composite Uniqueness
    CONSTRAINT uq_question_versions_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_version_number CHECK (version > 0),
    CONSTRAINT chk_version_reason CHECK (length(trim(change_reason)) > 0),

    -- One version per question per version number
    CONSTRAINT uq_question_version_number UNIQUE (question_id, version)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_versions_tenant_id') THEN
        ALTER TABLE public.question_versions ADD CONSTRAINT uq_question_versions_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_versions_question ON public.question_versions(question_id, version);
CREATE INDEX IF NOT EXISTS idx_question_versions_tenant ON public.question_versions(tenant_id, question_id, version);
CREATE INDEX IF NOT EXISTS idx_question_versions_created ON public.question_versions(tenant_id, created_at);

-- RLS
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_versions_select ON public.question_versions;
CREATE POLICY policy_question_versions_select
    ON public.question_versions FOR SELECT TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_question_versions_insert ON public.question_versions;
CREATE POLICY policy_question_versions_insert
    ON public.question_versions FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.question_versions IS 'Append-only immutable version history for questions — never UPDATE or DELETE';
COMMENT ON COLUMN public.question_versions.snapshot IS 'Full JSONB snapshot of the question at this version (all columns + options + explanations)';
COMMENT ON COLUMN public.question_versions.change_reason IS 'Audit reason for the change (e.g. Error fix, Difficulty re-evaluation, Content update)';
