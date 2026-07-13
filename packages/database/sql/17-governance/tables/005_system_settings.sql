-- ============================================================================
-- File       : 005_system_settings.sql
-- Module     : Governance
-- Purpose    : Platform-level system configuration (brand, timezone, maintenance).
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS system_settings CASCADE;

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    value_type VARCHAR(30) NOT NULL DEFAULT 'STRING',
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,

    deleted_at TIMESTAMPTZ,
    deleted_by UUID,

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_system_settings_key CHECK (setting_key ~ '^[a-z][a-z0-9_.]{1,98}$'),
    CONSTRAINT chk_system_settings_type CHECK (value_type IN ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'EMAIL', 'URL')),
    CONSTRAINT chk_system_settings_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_system_settings_version CHECK (version > 0)
);

COMMENT ON TABLE system_settings IS 'Platform-wide system configuration (maintenance mode, brand, timezone, support contact).';
COMMENT ON COLUMN system_settings.is_encrypted IS 'If true, value is stored encrypted via pgcrypto and decrypted at read time.';
COMMENT ON COLUMN system_settings.is_public IS 'If true, value is exposed via public API (e.g. brand name, support email).';
