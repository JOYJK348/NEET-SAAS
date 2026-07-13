-- ============================================================================
-- File       : 004_currencies.sql
-- Module     : Shared
-- Purpose    : ISO 4217 currency reference.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS currencies CASCADE;

CREATE TABLE currencies (
    code CHAR(3) PRIMARY KEY,
    numeric_code SMALLINT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    symbol_native VARCHAR(10),
    decimal_places SMALLINT NOT NULL DEFAULT 2,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_currencies_code CHECK (code ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_currencies_numeric CHECK (numeric_code BETWEEN 1 AND 999),
    CONSTRAINT chk_currencies_decimals CHECK (decimal_places BETWEEN 0 AND 6),
    CONSTRAINT chk_currencies_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_currencies_version CHECK (version > 0)
);

COMMENT ON TABLE currencies IS 'ISO 4217 currency codes. Used for fee, billing, and financial calculations.';
COMMENT ON COLUMN currencies.is_default IS 'Platform default currency (INR for Indian market).';
COMMENT ON COLUMN currencies.decimal_places IS 'Number of decimal places for formatting (e.g. 2 for USD, 3 for KWD, 0 for JPY).';
