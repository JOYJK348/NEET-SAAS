-- ============================================================================
-- File       : 013_countries_phone_codes.sql
-- Module     : Shared
-- Purpose    : Phone number validation rules per country for SMS/OTP/WhatsApp.
-- Depends On : countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS countries_phone_codes CASCADE;

CREATE TABLE countries_phone_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    phone_code VARCHAR(10) NOT NULL,
    example VARCHAR(30),
    mobile_length_min SMALLINT,
    mobile_length_max SMALLINT,
    landline_length_min SMALLINT,
    landline_length_max SMALLINT,
    national_prefix VARCHAR(5),
    validation_regex VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT uq_phone_codes_country UNIQUE (country_id, phone_code),
    CONSTRAINT chk_phone_codes_mobile CHECK (mobile_length_min IS NULL OR (mobile_length_max IS NOT NULL AND mobile_length_min <= mobile_length_max)),
    CONSTRAINT chk_phone_codes_landline CHECK (landline_length_min IS NULL OR (landline_length_max IS NOT NULL AND landline_length_min <= landline_length_max)),
    CONSTRAINT chk_phone_codes_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_phone_codes_version CHECK (version > 0)
);

COMMENT ON TABLE countries_phone_codes IS 'Country-specific phone number validation rules for OTP, SMS, and WhatsApp delivery.';
COMMENT ON COLUMN countries_phone_codes.example IS 'Example phone number for reference (e.g. +91 98765 43210).';
COMMENT ON COLUMN countries_phone_codes.mobile_length_min IS 'Minimum number of digits for mobile phones (excluding country code).';
COMMENT ON COLUMN countries_phone_codes.mobile_length_max IS 'Maximum number of digits for mobile phones (excluding country code).';
COMMENT ON COLUMN countries_phone_codes.validation_regex IS 'Optional regex pattern for programmatic phone validation.';
