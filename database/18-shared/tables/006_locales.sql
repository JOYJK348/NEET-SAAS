-- ============================================================================
-- File       : 006_locales.sql
-- Module     : Shared
-- Purpose    : Locale definitions for i18n, formatting, and translation.
-- Depends On : languages, countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS locales CASCADE;

CREATE TABLE locales (
    code VARCHAR(10) PRIMARY KEY,
    language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON UPDATE CASCADE ON DELETE RESTRICT,
    country_iso2 CHAR(2) NOT NULL REFERENCES countries(iso2) ON UPDATE CASCADE ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_locales_lang_country UNIQUE (language_code, country_iso2),
    CONSTRAINT chk_locales_code CHECK (code ~ '^[a-z]{2,3}-[A-Z]{2}$'),
    CONSTRAINT chk_locales_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_locales_version CHECK (version > 0)
);

COMMENT ON TABLE locales IS 'BCP-47 locale codes for UI translation, date/number formatting, and content localization.';
COMMENT ON COLUMN locales.code IS 'BCP-47 tag (e.g. en-IN, en-US, ta-IN, hi-IN).';
