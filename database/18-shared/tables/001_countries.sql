-- ============================================================================
-- File       : 001_countries.sql
-- Module     : Shared
-- Purpose    : ISO-3166 country reference lookup. Read-only for application.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS countries CASCADE;

CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso2 CHAR(2) NOT NULL UNIQUE,
    iso3 CHAR(3) NOT NULL UNIQUE,
    numeric_code SMALLINT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100),
    phone_code VARCHAR(10) NOT NULL,
    currency_code CHAR(3),
    continent VARCHAR(20),
    flag_emoji VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_countries_iso2 CHECK (iso2 ~ '^[A-Z]{2}$'),
    CONSTRAINT chk_countries_iso3 CHECK (iso3 ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_countries_numeric CHECK (numeric_code BETWEEN 4 AND 999),
    CONSTRAINT chk_countries_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_countries_version CHECK (version > 0)
);

COMMENT ON TABLE countries IS 'ISO-3166 country codes reference. Immutable after seeding.';
COMMENT ON COLUMN countries.iso2 IS 'ISO 3166-1 alpha-2 (e.g. IN, US).';
COMMENT ON COLUMN countries.iso3 IS 'ISO 3166-1 alpha-3 (e.g. IND, USA).';
COMMENT ON COLUMN countries.numeric_code IS 'ISO 3166-1 numeric (e.g. 356 for India).';
