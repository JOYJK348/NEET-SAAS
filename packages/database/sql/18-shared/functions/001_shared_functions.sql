-- ============================================================================
-- File       : 001_shared_functions.sql
-- Module     : Shared
-- Purpose    : Lookup resolution, validation helpers for shared reference data.
-- Depends On : countries, states, languages, currencies, timezones, locales,
--              file_types, mime_types, storage_providers, notification_channels,
--              error_codes, units_of_measure
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Country Lookups
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_country(
    p_iso2 CHAR DEFAULT NULL,
    p_iso3 CHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID, iso2 CHAR, iso3 CHAR, name VARCHAR, phone_code VARCHAR,
    currency_code CHAR, continent VARCHAR, flag_emoji VARCHAR
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.iso2, c.iso3, c.name, c.phone_code,
           c.currency_code, c.continent, c.flag_emoji
    FROM countries c
    WHERE c.is_active = true
      AND (p_iso2 IS NULL OR c.iso2 = p_iso2)
      AND (p_iso3 IS NULL OR c.iso3 = p_iso3)
    LIMIT 1;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Currency Lookup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_currency(p_code CHAR DEFAULT NULL)
RETURNS TABLE (code CHAR, name VARCHAR, symbol VARCHAR, decimal_places SMALLINT)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT c.code, c.name, c.symbol, c.decimal_places
    FROM currencies c
    WHERE c.is_active = true
      AND (p_code IS NULL OR c.code = p_code);
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Locale Lookup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_locale(p_code VARCHAR DEFAULT NULL)
RETURNS TABLE (code VARCHAR, language_code VARCHAR, country_iso2 CHAR, name VARCHAR)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT l.code, l.language_code, l.country_iso2, l.name
    FROM locales l
    WHERE l.is_active = true
      AND (p_code IS NULL OR l.code = p_code);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Timezone Lookup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_timezone(p_name VARCHAR DEFAULT NULL)
RETURNS TABLE (name VARCHAR, utc_offset VARCHAR, utc_offset_minutes SMALLINT, observes_dst BOOLEAN)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT t.name, t.utc_offset, t.utc_offset_minutes, t.observes_dst
    FROM timezones t
    WHERE t.is_active = true
      AND (p_name IS NULL OR t.name = p_name);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Error Code Lookup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_error(p_code VARCHAR)
RETURNS TABLE (code VARCHAR, module VARCHAR, message TEXT, detail TEXT, http_status SMALLINT)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT e.code, e.module, e.message, e.detail, e.http_status
    FROM error_codes e
    WHERE e.code = p_code AND e.is_active = true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Storage Provider Lookup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_storage_provider(p_code VARCHAR DEFAULT NULL)
RETURNS TABLE (code VARCHAR, name VARCHAR, config_schema JSONB)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT s.code, s.name, s.config_schema
    FROM storage_providers s
    WHERE s.is_active = true
      AND (p_code IS NULL OR s.code = p_code);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Validate Locale
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_locale(p_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM locales WHERE code = p_code AND is_active = true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. Validate Currency
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_currency(p_code CHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM currencies WHERE code = p_code AND is_active = true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. Validate Country
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_country(p_iso2 CHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM countries WHERE iso2 = p_iso2 AND is_active = true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. Validate MIME Type
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_mime(p_mime VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM mime_types WHERE mime_type = p_mime AND is_active = true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. Validate File Type
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_file_type(p_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM file_types WHERE code = p_code AND is_active = true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. Get Phone Code Rules for a Country
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_phone_code(
    p_country_iso2 CHAR,
    p_phone_code VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    country_iso2 CHAR, phone_code VARCHAR, example VARCHAR,
    mobile_length_min SMALLINT, mobile_length_max SMALLINT,
    national_prefix VARCHAR, validation_regex VARCHAR
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT c.iso2, pc.phone_code, pc.example,
           pc.mobile_length_min, pc.mobile_length_max,
           pc.national_prefix, pc.validation_regex
    FROM countries_phone_codes pc
    JOIN countries c ON c.id = pc.country_id
    WHERE c.iso2 = p_country_iso2
      AND (p_phone_code IS NULL OR pc.phone_code = p_phone_code)
      AND pc.is_active = true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 13. Validate Phone Number Against Country Rules
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_phone(
    p_phone VARCHAR,
    p_country_iso2 CHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_regex VARCHAR;
    v_digits VARCHAR;
BEGIN
    -- Get validation regex for country
    SELECT pc.validation_regex INTO v_regex
    FROM countries_phone_codes pc
    JOIN countries c ON c.id = pc.country_id
    WHERE c.iso2 = p_country_iso2
      AND pc.is_active = true
    LIMIT 1;

    -- Strip non-digits for length check
    v_digits := regexp_replace(p_phone, '\D', '', 'g');

    IF v_regex IS NOT NULL THEN
        RETURN v_digits ~ v_regex;
    END IF;

    -- Default: check if phone code matches
    RETURN EXISTS (
        SELECT 1 FROM fn_get_phone_code(p_country_iso2) pc
        WHERE length(v_digits) BETWEEN
            COALESCE(pc.mobile_length_min, 0) + length(regexp_replace(pc.phone_code, '\D', '', 'g'))
            AND COALESCE(pc.mobile_length_max, 20) + length(regexp_replace(pc.phone_code, '\D', '', 'g'))
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. Get Date Format Pattern
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_date_format(p_code VARCHAR)
RETURNS TABLE (code VARCHAR, format_pattern VARCHAR, category VARCHAR)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT df.code, df.format_pattern, df.category
    FROM date_formats df
    WHERE df.code = p_code AND df.is_active = true;
END;
$$;
