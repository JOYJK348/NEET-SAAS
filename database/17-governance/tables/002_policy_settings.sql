-- ============================================================================
-- File       : 002_policy_settings.sql
-- Module     : Governance
-- Purpose    : Key-value policy store with tenant override and validation rules.
-- Depends On : policy_categories
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS policy_settings CASCADE;

CREATE TABLE policy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    category_code VARCHAR(50) NOT NULL REFERENCES policy_categories(code) ON UPDATE CASCADE ON DELETE RESTRICT,

    policy_key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    value_type VARCHAR(30) NOT NULL DEFAULT 'STRING',
    default_value JSONB,
    validation_rule JSONB,
    description TEXT,

    is_system BOOLEAN NOT NULL DEFAULT false,
    is_editable BOOLEAN NOT NULL DEFAULT true,
    tenant_override BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_policy_settings_key UNIQUE (tenant_id, policy_key),
    CONSTRAINT chk_policy_settings_key CHECK (policy_key ~ '^[a-z][a-z0-9_.]{1,98}$'),
    CONSTRAINT chk_policy_settings_type CHECK (value_type IN ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'EMAIL', 'URL', 'REGEX', 'ENUM')),
    CONSTRAINT chk_policy_settings_validation CHECK (validation_rule IS NULL OR jsonb_typeof(validation_rule) = 'object'),
    CONSTRAINT chk_policy_settings_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_policy_settings_version CHECK (version > 0)
);

COMMENT ON TABLE policy_settings IS 'Central policy configuration store supporting hierarchical tenant override resolution.';
COMMENT ON COLUMN policy_settings.policy_key IS 'Dot-notation key (e.g. security.password.min_length).';
COMMENT ON COLUMN policy_settings.value IS 'Current effective value for the tenant scope (JSONB for type flexibility).';
COMMENT ON COLUMN policy_settings.value_type IS 'Data type constraint for runtime validation.';
COMMENT ON COLUMN policy_settings.default_value IS 'System default used when tenant_id IS NULL and no global override exists.';
COMMENT ON COLUMN policy_settings.validation_rule IS 'JSON schema or constraint expression (e.g. {"min": 8, "max": 128}).';
COMMENT ON COLUMN policy_settings.is_system IS 'System-protected policy; cannot be deleted.';
COMMENT ON COLUMN policy_settings.tenant_override IS 'If false, tenant-specific values are ignored and global is always used.';
