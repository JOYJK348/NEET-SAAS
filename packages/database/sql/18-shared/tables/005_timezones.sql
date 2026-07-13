-- ============================================================================
-- File       : 005_timezones.sql
-- Module     : Shared
-- Purpose    : IANA timezone reference.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS timezones CASCADE;

CREATE TABLE timezones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    utc_offset VARCHAR(10) NOT NULL,
    utc_offset_minutes SMALLINT NOT NULL,
    observes_dst BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_timezones_name CHECK (name ~ '^[A-Z][a-zA-Z0-9_\/+-]+$'),
    CONSTRAINT chk_timezones_offset CHECK (utc_offset ~ '^[+-]\d{2}:\d{2}$'),
    CONSTRAINT chk_timezones_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_timezones_version CHECK (version > 0)
);

COMMENT ON TABLE timezones IS 'IANA timezone database reference for scheduling, formatting, and display.';
