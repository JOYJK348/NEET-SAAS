-- ============================================================================
-- File       : 009_storage_providers.sql
-- Module     : Shared
-- Purpose    : Storage provider configuration for file storage abstraction.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS storage_providers CASCADE;

CREATE TABLE storage_providers (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config_schema JSONB,
    priority SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_storage_providers_code CHECK (code ~ '^[a-z][a-z0-9_]{1,49}$'),
    CONSTRAINT chk_storage_providers_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_storage_providers_version CHECK (version > 0)
);

COMMENT ON TABLE storage_providers IS 'Storage backend registry (S3, Cloudflare R2, Supabase, Azure Blob).';
COMMENT ON COLUMN storage_providers.config_schema IS 'JSON Schema defining required config fields for this provider.';
