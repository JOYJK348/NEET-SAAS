-- ============================================================================
-- File       : 006_api_keys.sql
-- Module     : Governance
-- Purpose    : Encrypted API key storage for third-party integrations.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS api_keys CASCADE;

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service VARCHAR(100) NOT NULL,
    key_display_name VARCHAR(100),
    encrypted_key TEXT NOT NULL,
    key_prefix VARCHAR(20),
    key_version SMALLINT NOT NULL DEFAULT 1,
    algorithm VARCHAR(30) NOT NULL DEFAULT 'pgp-sym',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_rotated_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_api_keys_service UNIQUE (tenant_id, service),
    CONSTRAINT chk_api_keys_service CHECK (length(trim(service)) > 0),
    CONSTRAINT chk_api_keys_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_api_keys_version CHECK (version > 0)
);

COMMENT ON TABLE api_keys IS 'Securely encrypted API key vault for outbound integrations (SMTP, SMS, Payment, AI).';
COMMENT ON COLUMN api_keys.encrypted_key IS 'PgpSymEncrypt(pgpsymencrypt)-encrypted secret value.';
COMMENT ON COLUMN api_keys.key_prefix IS 'First few chars for identification (e.g. sk-live-...). Never stores full key prefix in plaintext.';
COMMENT ON COLUMN api_keys.key_version IS 'Key version number for rotation tracking. Incremented on each rotation.';
COMMENT ON COLUMN api_keys.algorithm IS 'Encryption algorithm used (pgp-sym, aes-256, etc.).';
COMMENT ON COLUMN api_keys.last_rotated_at IS 'Timestamp of the most recent key rotation.';
