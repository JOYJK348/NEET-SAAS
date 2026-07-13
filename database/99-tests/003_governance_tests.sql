-- ============================================================================
-- File       : 003_governance_tests.sql
-- Module     : Tests
-- Purpose    : Post-deployment integrity tests for Governance module.
-- Run        : SELECT run_database_tests() or execute directly
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_pass INT := 0; v_fail INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'GOVERNANCE MODULE TESTS';
    RAISE NOTICE '============================================================';

    -- Test 1: Table existence
    BEGIN
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'policy_categories'), 'policy_categories missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'policy_settings'), 'policy_settings missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feature_flags'), 'feature_flags missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs'), 'audit_logs missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings'), 'system_settings missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys'), 'api_keys missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Table existence: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Table existence: FAIL - %', SQLERRM;
    END;

    -- Test 2: Seed data loaded
    BEGIN
        ASSERT (SELECT count(1) FROM policy_categories) >= 8, 'Expected >=8 policy categories';
        ASSERT (SELECT count(1) FROM policy_settings) >= 18, 'Expected >=18 policy settings';
        ASSERT (SELECT count(1) FROM feature_flags) >= 10, 'Expected >=10 feature flags';
        ASSERT (SELECT count(1) FROM system_settings) >= 8, 'Expected >=8 system settings';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Seed data: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Seed data: FAIL - %', SQLERRM;
    END;

    -- Test 3: Policy resolution
    BEGIN
        ASSERT (SELECT fn_get_policy(NULL, 'security.password.min_length'))::TEXT IS NOT NULL, 'fn_get_policy resolution failed';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Policy resolution: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Policy resolution: FAIL - %', SQLERRM;
    END;

    -- Test 4: Feature flag check
    BEGIN
        ASSERT fn_is_feature_enabled(NULL, 'non_existent_feature') = false, 'Non-existent feature should return false';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Feature flag check: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Feature flag check: FAIL - %', SQLERRM;
    END;

    -- Test 5: Audit log append-only enforcement
    BEGIN
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_before_audit_logs_protect'), 'Audit log protection trigger missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Audit append-only: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Audit append-only: FAIL - %', SQLERRM;
    END;

    -- Test 6: RLS enabled
    BEGIN
        ASSERT (SELECT count(1) FROM pg_tables WHERE tablename IN ('policy_categories','policy_settings','feature_flags','audit_logs','system_settings','api_keys') AND rowsecurity = true) = 6, 'RLS not enabled on all governance tables';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ RLS enabled: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ RLS enabled: FAIL - %', SQLERRM;
    END;

    -- Test 7: Audit log function exists
    BEGIN
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_write_audit') IS NOT NULL, 'fn_write_audit missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Audit function: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Audit function: FAIL - %', SQLERRM;
    END;

    -- Test 8: No duplicate policy keys
    BEGIN
        ASSERT NOT EXISTS (
            SELECT policy_key, tenant_id FROM policy_settings WHERE deleted_at IS NULL
            GROUP BY policy_key, tenant_id HAVING count(1) > 1
        ), 'Duplicate policy keys found';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ No duplicate policies: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ No duplicate policies: FAIL - %', SQLERRM;
    END;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RESULTS: % passed, % failed', v_pass, v_fail;
    RAISE NOTICE '============================================================';

    IF v_fail > 0 THEN
        RAISE EXCEPTION 'Governance module: % tests failed.', v_fail;
    END IF;
END $$;
