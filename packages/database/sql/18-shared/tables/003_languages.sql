-- ============================================================================
-- File       : 003_languages.sql
-- Module     : Shared
-- Purpose    : ISO 639 language reference.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS languages CASCADE;

CREATE TABLE languages (
    code VARCHAR(10) PRIMARY KEY,
    iso_639_1 CHAR(2),
    iso_639_2 CHAR(3),
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100),
    is_rtl BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_languages_iso639_1 UNIQUE (iso_639_1),
    CONSTRAINT uq_languages_iso639_2 UNIQUE (iso_639_2),
    CONSTRAINT chk_languages_code CHECK (code ~ '^[a-z]{2,3}$'),
    CONSTRAINT chk_languages_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_languages_version CHECK (version > 0)
);

COMMENT ON TABLE languages IS 'ISO 639 language codes reference. Supports UI translation and content localization.';
COMMENT ON COLUMN languages.iso_639_1 IS 'ISO 639-1 two-letter code (e.g. en, ta, hi).';
COMMENT ON COLUMN languages.iso_639_2 IS 'ISO 639-2 three-letter code (e.g. eng, tam, hin).';
COMMENT ON COLUMN languages.is_rtl IS 'Right-to-left script (Arabic, Hebrew, Urdu, etc.).';
