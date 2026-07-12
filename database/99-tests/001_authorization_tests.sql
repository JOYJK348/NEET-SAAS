-- ============================================================================
-- File       : 001_authorization_tests.sql
-- Module     : Tests
-- Purpose    : Post-deployment integrity tests for Authorization module.
-- Run        : SELECT run_database_tests() or execute directly
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_pass INT := 0; v_fail INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'AUTHORIZATION MODULE TESTS';
    RAISE NOTICE '============================================================';

    -- Test 1: Table existence
    BEGIN
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles'), 'roles table missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permissions'), 'permissions table missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role_permissions'), 'role_permissions table missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles'), 'user_roles table missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Table existence: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Table existence: FAIL - %', SQLERRM;
    END;

    -- Test 2: Seed data loaded
    BEGIN
        ASSERT (SELECT count(1) FROM roles) > 0, 'No roles seeded';
        ASSERT (SELECT count(1) FROM permissions) > 0, 'No permissions seeded';
        ASSERT (SELECT count(1) FROM permission_groups) > 0, 'No permission groups seeded';
        ASSERT (SELECT count(1) FROM menu_groups) > 0, 'No menu groups seeded';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Seed data: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Seed data: FAIL - %', SQLERRM;
    END;

    -- Test 3: FK integrity (no orphan records)
    BEGIN
        ASSERT NOT EXISTS (SELECT 1 FROM role_permissions rp LEFT JOIN roles r ON r.id = rp.role_id WHERE r.id IS NULL), 'Orphan role_permissions';
        ASSERT NOT EXISTS (SELECT 1 FROM user_roles ur LEFT JOIN roles r ON r.id = ur.role_id WHERE r.id IS NULL), 'Orphan user_roles';
        ASSERT NOT EXISTS (SELECT 1 FROM role_permissions rp LEFT JOIN permissions p ON p.id = rp.permission_id WHERE p.id IS NULL), 'Orphan role_permissions->permissions';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ FK integrity: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ FK integrity: FAIL - %', SQLERRM;
    END;

    -- Test 4: RLS enabled
    BEGIN
        ASSERT (SELECT count(1) FROM pg_tables WHERE tablename IN ('roles','permissions','role_permissions','user_roles') AND rowsecurity = true) = 4, 'RLS not enabled on all tables';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ RLS enabled: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ RLS enabled: FAIL - %', SQLERRM;
    END;

    -- Test 5: Permission resolution
    BEGIN
        ASSERT fn_has_permission IS NOT NULL, 'fn_has_permission not defined';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Permission function: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Permission function: FAIL - %', SQLERRM;
    END;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RESULTS: % passed, % failed', v_pass, v_fail;
    RAISE NOTICE '============================================================';

    IF v_fail > 0 THEN
        RAISE EXCEPTION 'Authorization module: % tests failed.', v_fail;
    END IF;
END $$;
