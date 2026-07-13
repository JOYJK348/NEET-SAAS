-- ============================================================================
-- File       : 011_error_codes.sql
-- Module     : Shared
-- Purpose    : Shared error code catalogue for consistent API error responses.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS error_codes CASCADE;

CREATE TABLE error_codes (
    code VARCHAR(30) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    detail TEXT,
    http_status SMALLINT NOT NULL DEFAULT 400,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_error_codes_code CHECK (code ~ '^[A-Z][A-Z0-9_]{2,29}$'),
    CONSTRAINT chk_error_codes_http CHECK (http_status BETWEEN 100 AND 599),
    CONSTRAINT chk_error_codes_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_error_codes_version CHECK (version > 0)
);

COMMENT ON TABLE error_codes IS 'Centralized error code catalogue ensuring consistent error contracts across backend, frontend, and mobile.';
COMMENT ON COLUMN error_codes.module IS 'Module prefix (AUTH, USER, EXAM, FEE, COMMON, etc.).';
