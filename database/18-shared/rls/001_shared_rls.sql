-- ============================================================================
-- File       : 001_shared_rls.sql
-- Module     : Shared
-- Purpose    : RLS policies for shared lookup tables.
-- Depends On : all shared tables
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE mime_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries_phone_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_formats ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Generic pattern: SELECT for all authenticated, INSERT/UPDATE for admin
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
            DROP POLICY IF EXISTS %I_select ON %I;
            CREATE POLICY %I_select ON %I FOR SELECT TO authenticated USING (true);
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);

        EXECUTE format('
            DROP POLICY IF EXISTS %I_insert ON %I;
            CREATE POLICY %I_insert ON %I FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(NULL, ''platform.admin''));
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);

        EXECUTE format('
            DROP POLICY IF EXISTS %I_update ON %I;
            CREATE POLICY %I_update ON %I FOR UPDATE TO authenticated USING (fn_rls_can_update(NULL, ''platform.admin'', false)) WITH CHECK (fn_rls_can_update(NULL, ''platform.admin'', false));
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);

        EXECUTE format('
            DROP POLICY IF EXISTS %I_delete ON %I;
            CREATE POLICY %I_delete ON %I FOR DELETE TO authenticated USING (false);
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);
    END LOOP;
END $$;
