-- ============================================================================
-- File       : 002_workflow_tests.sql
-- Module     : Tests
-- Purpose    : Post-deployment integrity tests for Workflow engine.
-- Run        : SELECT run_database_tests() or execute directly
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_pass INT := 0; v_fail INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'WORKFLOW MODULE TESTS';
    RAISE NOTICE '============================================================';

    -- Test 1: Table existence
    BEGIN
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_states'), 'workflow_states missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_actions'), 'workflow_actions missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_requests'), 'workflow_requests missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_history'), 'workflow_history missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_transitions'), 'workflow_transitions missing';
        ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_notification_dead_letters'), 'workflow_notification_dead_letters missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Table existence: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Table existence: FAIL - %', SQLERRM;
    END;

    -- Test 2: Seed data loaded
    BEGIN
        ASSERT (SELECT count(1) FROM workflow_states) >= 6, 'Expected >=6 states';
        ASSERT (SELECT count(1) FROM workflow_actions) >= 7, 'Expected >=7 actions';
        ASSERT (SELECT count(1) FROM workflow_transitions) >= 6, 'Expected >=6 transitions';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Seed data: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Seed data: FAIL - %', SQLERRM;
    END;

    -- Test 3: State machine integrity (no broken transitions)
    BEGIN
        ASSERT NOT EXISTS (
            SELECT 1 FROM workflow_transitions wt
            LEFT JOIN workflow_states ws1 ON ws1.code = wt.from_status
            LEFT JOIN workflow_states ws2 ON ws2.code = wt.to_status
            WHERE ws1.code IS NULL OR ws2.code IS NULL
        ), 'Broken transitions found';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ State machine integrity: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ State machine integrity: FAIL - %', SQLERRM;
    END;

    -- Test 4: Initial state exists
    BEGIN
        ASSERT EXISTS (SELECT 1 FROM workflow_states WHERE is_initial = true), 'No initial state defined';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Initial state: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Initial state: FAIL - %', SQLERRM;
    END;

    -- Test 5: Core functions exist
    BEGIN
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_start_workflow') IS NOT NULL, 'fn_start_workflow missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_submit_action') IS NOT NULL, 'fn_submit_action missing';
        ASSERT (SELECT proname FROM pg_proc WHERE proname = 'fn_get_available_actions') IS NOT NULL, 'fn_get_available_actions missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Core functions: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Core functions: FAIL - %', SQLERRM;
    END;

    -- Test 6: RLS enabled
    BEGIN
        ASSERT (SELECT count(1) FROM pg_tables WHERE tablename LIKE 'workflow_%' AND rowsecurity = true) >= 10, 'RLS not enabled on all workflow tables';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ RLS enabled: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ RLS enabled: FAIL - %', SQLERRM;
    END;

    -- Test 7: No cyclic escalations
    BEGIN
        WITH RECURSIVE escalation_walk AS (
            SELECT id, escalation_step_id, ARRAY[id] AS path, false AS is_cycle
            FROM workflow_steps WHERE deleted_at IS NULL AND escalation_step_id IS NOT NULL
            UNION ALL
            SELECT ws.id, ws.escalation_step_id, ew.path || ws.id, ws.id = ANY(ew.path)
            FROM workflow_steps ws JOIN escalation_walk ew ON ew.escalation_step_id = ws.id
            WHERE ws.deleted_at IS NULL AND NOT ew.is_cycle AND ws.escalation_step_id IS NOT NULL
        )
        ASSERT NOT EXISTS (SELECT 1 FROM escalation_walk WHERE is_cycle = true), 'Cyclic escalation found';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ No cyclic escalations: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ No cyclic escalations: FAIL - %', SQLERRM;
    END;

    -- Test 8: Trigger exists for history notifications
    BEGIN
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_after_insert_workflow_history'), 'History trigger missing';
        v_pass := v_pass + 1;
        RAISE NOTICE '  ✓ Notification trigger: PASS';
    EXCEPTION WHEN OTHERS THEN
        v_fail := v_fail + 1; RAISE WARNING '  ✗ Notification trigger: FAIL - %', SQLERRM;
    END;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RESULTS: % passed, % failed', v_pass, v_fail;
    RAISE NOTICE '============================================================';

    IF v_fail > 0 THEN
        RAISE EXCEPTION 'Workflow module: % tests failed.', v_fail;
    END IF;
END $$;
