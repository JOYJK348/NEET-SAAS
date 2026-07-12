-- ============================================================================
-- File       : 001_shared_triggers.sql
-- Module     : Shared
-- Purpose    : Audit stamp automation, immutable lookup protection, cache NOTIFY.
-- Depends On : all shared tables
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Touch Audit Columns (all shared tables)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_tab RECORD;
BEGIN
    FOR v_tab IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('countries', 'states', 'languages', 'currencies', 'timezones',
                             'locales', 'file_types', 'mime_types', 'storage_providers',
                             'notification_channels', 'error_codes', 'units_of_measure',
                             'countries_phone_codes', 'date_formats')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_biu_%I_touch_audit ON %I;
            CREATE TRIGGER trg_biu_%I_touch_audit
                BEFORE INSERT OR UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION touch_audit_columns();
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Immutable Lookup Protection (prevent DELETE on reference data)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_shared_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Shared lookup tables are immutable. DELETE is prohibited on %.', TG_TABLE_NAME;
END;
$$;

DO $$
DECLARE
    v_tab RECORD;
BEGIN
    FOR v_tab IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('countries', 'languages', 'currencies', 'timezones',
                             'locales', 'error_codes', 'units_of_measure', 'date_formats')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_bd_%I_immutable ON %I;
            CREATE TRIGGER trg_bd_%I_immutable
                BEFORE DELETE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION fn_trg_shared_immutable();
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Cache Refresh NOTIFY on Data Change (countries, currencies, locales)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_shared_cache_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM pg_notify('lookup_cache_refresh', json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
    )::TEXT);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_after_countries_cache
    AFTER INSERT OR UPDATE OR DELETE ON countries
    FOR EACH STATEMENT EXECUTE FUNCTION fn_trg_shared_cache_notify();

CREATE TRIGGER trg_after_currencies_cache
    AFTER INSERT OR UPDATE OR DELETE ON currencies
    FOR EACH STATEMENT EXECUTE FUNCTION fn_trg_shared_cache_notify();

CREATE TRIGGER trg_after_locales_cache
    AFTER INSERT OR UPDATE OR DELETE ON locales
    FOR EACH STATEMENT EXECUTE FUNCTION fn_trg_shared_cache_notify();
