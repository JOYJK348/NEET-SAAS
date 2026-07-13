-- ============================================================================
-- File       : 001_policy_categories.sql
-- Module     : Governance
-- Purpose    : Policy category taxonomy for organizing platform-wide rules.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS policy_categories CASCADE;

CREATE TABLE policy_categories (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_policy_categories_code CHECK (code ~ '^[a-z][a-z_]{1,49}$'),
    CONSTRAINT chk_policy_categories_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_policy_categories_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_policy_categories_version CHECK (version > 0)
);

COMMENT ON TABLE policy_categories IS 'Taxonomy of policy categories for organizing platform configuration rules.';
COMMENT ON COLUMN policy_categories.code IS 'Unique lowercase snake_case identifier (e.g. security, authentication, exam).';
