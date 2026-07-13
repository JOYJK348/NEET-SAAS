-- ============================================================================
-- File       : 003_feature_flags.sql
-- Module     : Governance
-- Purpose    : Dynamic feature flag system for phased rollouts and plan gating.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS feature_flags CASCADE;

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    feature_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,

    rollout_percentage SMALLINT DEFAULT 100,
    plan_required VARCHAR(50),
    beta BOOLEAN NOT NULL DEFAULT false,
    internal BOOLEAN NOT NULL DEFAULT false,
    deprecated BOOLEAN NOT NULL DEFAULT false,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_feature_flags_key UNIQUE (tenant_id, feature_key),
    CONSTRAINT chk_feature_flags_key CHECK (feature_key ~ '^[a-z][a-z0-9_.]{1,98}$'),
    CONSTRAINT chk_feature_flags_rollout CHECK (rollout_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_feature_flags_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_feature_flags_version CHECK (version > 0)
);

COMMENT ON TABLE feature_flags IS 'Feature toggle system for gradual rollouts, A/B testing, and plan-based gating.';
COMMENT ON COLUMN feature_flags.tenant_id IS 'NULL = global flag; non-NULL = tenant-specific override.';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of requests/users that see this feature (0-100).';
COMMENT ON COLUMN feature_flags.plan_required IS 'Only enable if tenant subscription plan matches (e.g. PREMIUM, ENTERPRISE).';
COMMENT ON COLUMN feature_flags.beta IS 'Feature in beta; only beta users can access.';
COMMENT ON COLUMN feature_flags.internal IS 'Internal-only feature; never exposed to tenants.';
