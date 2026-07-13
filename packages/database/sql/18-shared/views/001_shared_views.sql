-- ============================================================================
-- File       : 001_shared_views.sql
-- Module     : Shared
-- Purpose    : Unified views for active reference data and catalogues.
-- Depends On : countries, languages, locales, storage_providers, notification_channels, error_codes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Active Countries
CREATE OR REPLACE VIEW v_active_countries AS
SELECT iso2, iso3, name, native_name, phone_code, currency_code, continent, flag_emoji
FROM countries
WHERE is_active = true
ORDER BY display_order, name;

-- 2. Active Languages
CREATE OR REPLACE VIEW v_active_languages AS
SELECT code, iso_639_1, iso_639_2, name, native_name, is_rtl
FROM languages
WHERE is_active = true
ORDER BY display_order, name;

-- 3. Supported Locales
CREATE OR REPLACE VIEW v_supported_locales AS
SELECT l.code, l.name, l.language_code, l.country_iso2,
       lang.name AS language_name, c.name AS country_name
FROM locales l
JOIN languages lang ON lang.code = l.language_code
JOIN countries c ON c.iso2 = l.country_iso2
WHERE l.is_active = true
ORDER BY l.display_order, l.code;

-- 4. Storage Providers
CREATE OR REPLACE VIEW v_storage_providers AS
SELECT code, name, description, config_schema, priority
FROM storage_providers
WHERE is_active = true
ORDER BY priority, name;

-- 5. Notification Channels
CREATE OR REPLACE VIEW v_notification_channels AS
SELECT code, name, description, supports_attachments, supports_templates, max_body_size
FROM notification_channels
WHERE is_active = true
ORDER BY display_order, name;

-- 6. Error Catalogue
CREATE OR REPLACE VIEW v_error_catalogue AS
SELECT code, module, message, detail, http_status
FROM error_codes
WHERE is_active = true
ORDER BY module, code;

COMMENT ON VIEW v_active_countries IS 'Active ISO countries for dropdowns and phone/currency resolution.';
COMMENT ON VIEW v_active_languages IS 'Active languages available for UI and content translation.';
COMMENT ON VIEW v_supported_locales IS 'Supported UI locales with language and country names resolved.';
COMMENT ON VIEW v_storage_providers IS 'Active storage backends available for file upload configuration.';
COMMENT ON VIEW v_notification_channels IS 'Active notification delivery channels.';
COMMENT ON VIEW v_error_catalogue IS 'Complete error code catalogue for API contract consistency.';
