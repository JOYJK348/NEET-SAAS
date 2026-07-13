-- ============================================================================
-- File       : 002_states.sql
-- Module     : Shared
-- Purpose    : State/province/region reference per country.
-- Depends On : countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS states CASCADE;

CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'STATE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_states_country_code UNIQUE (country_id, code),
    CONSTRAINT chk_states_type CHECK (type IN ('STATE', 'PROVINCE', 'TERRITORY', 'REGION', 'EMIRATE', 'CANTON', 'COUNTY', 'PREFECTURE')),
    CONSTRAINT chk_states_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_states_version CHECK (version > 0)
);

COMMENT ON TABLE states IS 'Administrative divisions (states, provinces, territories) per country.';
COMMENT ON COLUMN states.code IS 'Local administrative code (e.g. TN, CA, DL).';
COMMENT ON COLUMN states.type IS 'Division type classification for UI formatting.';
