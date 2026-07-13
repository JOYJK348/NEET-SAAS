-- ============================================================================
-- File       : 001_shared_procedures.sql
-- Module     : Shared
-- Purpose    : Cache refresh, seed verification, catalog integrity procedures.
-- Depends On : all shared tables
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Refresh Lookup Cache (pg_notify for application-level cache invalidation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_refresh_lookup_cache()
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_notify('lookup_cache_refresh', json_build_object(
        'timestamp', NOW(),
        'tables', ARRAY['countries', 'states', 'languages', 'currencies', 'timezones',
                        'locales', 'file_types', 'mime_types', 'storage_providers',
                        'notification_channels', 'error_codes', 'units_of_measure']
    )::TEXT);
    RAISE NOTICE 'Lookup cache refresh notification sent for all shared tables.';
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Seed Shared Data (idempotent re-seed)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_seed_shared()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Call seed scripts in dependency order
    -- Countries (no deps)
    -- Languages (no deps)
    -- Currencies (no deps)
    -- Timezones (no deps)
    -- Storage Providers (no deps)
    -- Notification Channels (no deps)
    -- Error Codes (no deps)
    -- Units of Measure (no deps)
    -- File Types (no deps)
    -- States (depends on countries)
    -- MIME Types (depends on file types)
    -- Locales (depends on languages, countries)
    RAISE NOTICE 'Execute seed files in compile order. This procedure is a placeholder for orchestration.';
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Verify Shared Catalogues Integrity
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_verify_shared_catalogues()
LANGUAGE plpgsql
AS $$
DECLARE
    v_countries INT; v_languages INT; v_currencies INT;
    v_timezones INT; v_locales INT; v_mime INT;
BEGIN
    SELECT count(1) INTO v_countries FROM countries WHERE is_active = true;
    SELECT count(1) INTO v_languages FROM languages WHERE is_active = true;
    SELECT count(1) INTO v_currencies FROM currencies WHERE is_active = true;
    SELECT count(1) INTO v_timezones FROM timezones WHERE is_active = true;
    SELECT count(1) INTO v_locales FROM locales WHERE is_active = true;
    SELECT count(1) INTO v_mime FROM mime_types WHERE is_active = true;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'SHARED CATALOGUE VERIFICATION';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Countries          : %', v_countries;
    RAISE NOTICE 'Languages          : %', v_languages;
    RAISE NOTICE 'Currencies         : %', v_currencies;
    RAISE NOTICE 'Timezones          : %', v_timezones;
    RAISE NOTICE 'Locales            : %', v_locales;
    RAISE NOTICE 'MIME Types         : %', v_mime;

    IF v_countries = 0 THEN RAISE WARNING 'Countries catalogue is empty. Run seed files.'; END IF;
    IF v_languages = 0 THEN RAISE WARNING 'Languages catalogue is empty. Run seed files.'; END IF;
    IF v_currencies = 0 THEN RAISE WARNING 'Currencies catalogue is empty. Run seed files.'; END IF;
    IF v_locales = 0 THEN RAISE WARNING 'Locales catalogue is empty. Run seed files.'; END IF;
    RAISE NOTICE '============================================================';
END;
$$;
