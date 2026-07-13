-- ============================================================================
-- File       : 014_date_formats.sql
-- Module     : Shared
-- Purpose    : Date/time format reference for localization, reports, and exports.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS date_formats CASCADE;

CREATE TABLE date_formats (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    format_pattern VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL,
    example_output VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_date_formats_code CHECK (code ~ '^[A-Z][A-Z0-9_]{1,29}$'),
    CONSTRAINT chk_date_formats_category CHECK (category IN ('DATE', 'TIME', 'DATETIME', 'MONTH', 'YEAR', 'WEEKDAY', 'QUARTER')),
    CONSTRAINT chk_date_formats_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_date_formats_version CHECK (version > 0)
);

COMMENT ON TABLE date_formats IS 'Standardized date/time format patterns for UI, reports, exports, and localization.';
COMMENT ON COLUMN date_formats.format_pattern IS 'strftime/Moment.js format pattern (e.g. DD/MM/YYYY, hh:mm A).';
COMMENT ON COLUMN date_formats.example_output IS 'Example formatted output for reference (e.g. 12/07/2026).';
