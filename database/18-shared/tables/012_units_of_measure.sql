-- ============================================================================
-- File       : 012_units_of_measure.sql
-- Module     : Shared
-- Purpose    : Units of measure reference for analytics and data collection.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS units_of_measure CASCADE;

CREATE TABLE units_of_measure (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    symbol VARCHAR(10),
    base_unit VARCHAR(30),
    conversion_factor NUMERIC(20, 10),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_uom_code CHECK (code ~ '^[A-Z][A-Z0-9_]{1,29}$'),
    CONSTRAINT chk_uom_category CHECK (category IN ('WEIGHT', 'LENGTH', 'VOLUME', 'TIME', 'TEMPERATURE', 'AREA', 'SPEED', 'PERCENTAGE', 'COUNT', 'DATA', 'ENERGY', 'PRESSURE', 'ANGLE')),
    CONSTRAINT chk_uom_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_uom_version CHECK (version > 0)
);

COMMENT ON TABLE units_of_measure IS 'Units of measure catalogue for analytics, attendance, and data collection.';
COMMENT ON COLUMN units_of_measure.base_unit IS 'Reference base unit for conversion (e.g. KG for gram, METRE for cm).';
COMMENT ON COLUMN units_of_measure.conversion_factor IS 'Multiplier to convert to base unit (e.g. 0.001 for gram -> KG).';
