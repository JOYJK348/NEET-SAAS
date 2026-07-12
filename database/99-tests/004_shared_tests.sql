-- ============================================================================
-- File       : 004_shared_tests.sql
-- Module     : Tests
-- Purpose    : Post-deployment integrity tests for Shared lookup module.
-- Run        : SELECT run_database_tests() or execute directly
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_pass INT := 0; v_fail INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'SHARED MODULE TESTS';
    RAISE NOTICE '============================================================';

    -- Test 1: Table existence (all 14)
    BEGIN
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'countries'), 'countries missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'states'), 'states missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'languages'), 'languages missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'currencies'), 'currencies missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'timezones'), 'timezones missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'locales'), 'locales missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'file_types'), 'file_types missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mime_types'), 'mime_types missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'storage_providers'), 'storage_providers missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_channels'), 'notification_channels missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'error_codes'), 'error_codes missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'units_of_measure'), 'units_of_measure missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'countries_phone_codes'), 'countries_phone_codes missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'date_formats'), 'date_formats missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Table existence (14): PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Table existence: FAIL - %', SQLERRM;
    END;

    -- Test 2: Seed data loaded
    BEGIN
        ASSERT (SELECT count(1) FROM countries) >= 40, 'Expected >=40 countries';
        ASSERT (SELECT count(1) FROM languages) >= 30, 'Expected >=30 languages';
        ASSERT (SELECT count(1) FROM currencies) >= 35, 'Expected >=35 currencies';
        ASSERT (SELECT count(1) FROM timezones) >= 45, 'Expected >=45 timezones';
        ASSERT (SELECT count(1) FROM error_codes) >= 40, 'Expected >=40 error codes';
        ASSERT (SELECT count(1) FROM mime_types) >= 40, 'Expected >=40 MIME types';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Seed data: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Seed data: FAIL - %', SQLERRM;
    END;

    -- Test 3: ISO code uniqueness
    BEGIN
        ASSERT (SELECT count(1) FROM countries WHERE is_active = true GROUP BY iso2 HAVING count(1) > 1) = 0, 'Duplicate iso2';
        ASSERT (SELECT count(1) FROM countries WHERE is_active = true GROUP BY iso3 HAVING count(1) > 1) = 0, 'Duplicate iso3';
        ASSERT (SELECT count(1) FROM currencies GROUP BY code HAVING count(1) > 1) = 0, 'Duplicate currency codes';
        ASSERT (SELECT count(1) FROM languages GROUP BY code HAVING count(1) > 1) = 0, 'Duplicate language codes';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ ISO uniqueness: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ ISO uniqueness: FAIL - %', SQLERRM;
    END;

    -- Test 4: FK integrity (no orphans)
    BEGIN
        ASSERT NOT EXISTS (SELECT 1 FROM states s LEFT JOIN countries c ON c.id = s.country_id WHERE c.id IS NULL), 'Orphan states';
        ASSERT NOT EXISTS (SELECT 1 FROM locales l LEFT JOIN languages lang ON lang.code = l.language_code WHERE lang.code IS NULL), 'Orphan locales';
        ASSERT NOT EXISTS (SELECT 1 FROM locales l LEFT JOIN countries c ON c.iso2 = l.country_iso2 WHERE c.iso2 IS NULL), 'Orphan locales->countries';
        ASSERT NOT EXISTS (SELECT 1 FROM mime_types mt LEFT JOIN file_types ft ON ft.code = mt.file_type_code WHERE ft.code IS NULL), 'Orphan mime_types';
        ASSERT NOT EXISTS (SELECT 1 FROM countries_phone_codes pc LEFT JOIN countries c ON c.id = pc.country_id WHERE c.id IS NULL), 'Orphan phone_codes';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ FK integrity: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ FK integrity: FAIL - %', SQLERRM;
    END;

    -- Test 5: Error code format
    BEGIN
        ASSERT NOT EXISTS (SELECT 1 FROM error_codes WHERE code !~ '^[A-Z][A-Z_]{2,29}$'), 'Invalid error code format';
        ASSERT (SELECT count(1) FROM error_codes WHERE module = 'AUTH') > 5, 'Expected auth error codes';
        ASSERT (SELECT count(1) FROM error_codes WHERE module = 'COMMON') >= 5, 'Expected common error codes';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Error code format: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Error code format: FAIL - %', SQLERRM;
    END;

    -- Test 6: Function existence
    BEGIN
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_get_country') IS NOT NULL, 'fn_get_country missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_get_currency') IS NOT NULL, 'fn_get_currency missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_get_error') IS NOT NULL, 'fn_get_error missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_validate_phone') IS NOT NULL, 'fn_validate_phone missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_get_date_format') IS NOT NULL, 'fn_get_date_format missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_get_storage_provider') IS NOT NULL, 'fn_get_storage_provider missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Functions: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Functions: FAIL - %', SQLERRM;
    END;

    -- Test 7: Immutable DELETE protection
    BEGIN
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bd_countries_immutable'), 'Countries immutable trigger missing';
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bd_languages_immutable'), 'Languages immutable trigger missing';
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bd_currencies_immutable'), 'Currencies immutable trigger missing';
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bd_error_codes_immutable'), 'Error codes immutable trigger missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Immutable protection: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Immutable protection: FAIL - %', SQLERRM;
    END;

    -- Test 8: RLS enabled
    BEGIN
        SELECT count(1) INTO v_pass FROM pg_tables
        WHERE tablename IN ('countries','states','languages','currencies','timezones','locales','file_types','mime_types','storage_providers','notification_channels','error_codes','units_of_measure','countries_phone_codes','date_formats')
          AND rowsecurity = true;
        ASSERT v_pass = 14, 'RLS not enabled on all shared tables';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ RLS enabled (14/14): PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ RLS enabled: FAIL - %', SQLERRM;
    END;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RESULTS: % passed, % failed', v_pass, v_fail;
    RAISE NOTICE '============================================================';

    IF v_fail > 0 THEN
        RAISE EXCEPTION 'Shared module: % tests failed.', v_fail;
    END IF;
END $$;
