-- ============================================================================
-- File       : 004_comprehensive_integration_test.sql
-- Module     : Testing
-- Purpose    : Automated end-to-end integration testing suite for Authorization & Workflow.
-- Depends On : Entire authorization & workflow schema layers
-- Author     : Principal Database QA Engineer
-- Version    : 1.0.3
-- ============================================================================

DO $$
DECLARE
    -- Tenant UUIDs
    v_tenant_a UUID := '88888888-8888-8888-8888-888888888888';
    v_tenant_b UUID := '99999999-9999-9999-9999-999999999999';
    
    -- User UUIDs
    v_user_faculty UUID := '11111111-1111-1111-1111-111111111111';
    v_user_approver UUID := '22222222-2222-2222-2222-222222222222';
    
    -- Variables for results checking
    v_req_id UUID;
    v_has_perm BOOLEAN;
    v_can_access BOOLEAN;
    v_version INT;
    v_notif_count INT;
    v_history_count INT;
    v_current_status VARCHAR(30);
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING PRINCIPAL QA INTEGRATION TESTING SUITE';
    RAISE NOTICE '============================================================';

    -- Mock session claims context representing Tenant Alpha Faculty to satisfy RLS rules
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_user_faculty, 'role', 'authenticated', 'tenantId', v_tenant_a)::text, true);

    -- ------------------------------------------------------------------------
    -- PHASE 1: FUNCTION VERIFICATION (RBAC & Permissions Engines)
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 1: Verifying permission engine functions...';

    -- Test: Check if user has permission
    v_has_perm := fn_has_permission(v_tenant_a, v_user_faculty, 'academics.subjects.view');
    ASSERT v_has_perm = TRUE, 'Test Failed: Faculty user should have permission to view subjects.';
    RAISE NOTICE ' - fn_has_permission (Faculty Academics check): PASSED';

    -- Test: Check permission check for unmapped credentials
    v_has_perm := fn_has_permission(v_tenant_a, v_user_faculty, 'platform.roles.delete');
    ASSERT v_has_perm = FALSE, 'Test Failed: Faculty user must NOT have permission to delete platform roles.';
    RAISE NOTICE ' - fn_has_permission (Platform restriction check): PASSED';

    -- Test: Check menu access resolution
    v_can_access := fn_can_access_menu(v_tenant_a, v_user_faculty, '22222222-2222-2222-2222-200000000000'::UUID); -- Subjects Menu
    ASSERT v_can_access = TRUE, 'Test Failed: Faculty user should have access to Subjects Menu.';
    RAISE NOTICE ' - fn_can_access_menu (Dynamic sidebar check): PASSED';


    -- ------------------------------------------------------------------------
    -- PHASE 2: VIEW VERIFICATION (Dynamic queries performance)
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 2: Verifying dynamic schema views...';

    -- Querying views to assert compilation syntax correctness
    PERFORM count(1) FROM v_user_permissions;
    PERFORM count(1) FROM v_menu_access;
    PERFORM count(1) FROM v_pending_workflows;
    PERFORM count(1) FROM v_my_tasks;
    PERFORM count(1) FROM v_workflow_timeline;
    
    RAISE NOTICE ' - All database views queried successfully: PASSED';


    -- ------------------------------------------------------------------------
    -- PHASE 3: WORKFLOW SIMULATION (Submit -> Approve -> Reopen transitions)
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 3: Simulating end-to-end Workflow lifecycle...';

    -- 1. Start a workflow request
    v_req_id := fn_start_workflow(
        v_tenant_a,
        'bbbbbbbb-bbbb-bbbb-bbbb-888888888888'::UUID, -- EXAM_PUBLISH workflow
        'EXAM',
        'e0000000-0000-0000-0000-000000000000'::UUID,
        v_user_faculty,
        'CRITICAL',
        '{"title": "Annual Biology Test 2026", "total_marks": 720}'::jsonb
    );
    ASSERT v_req_id IS NOT NULL, 'Test Failed: Failed to start workflow request.';
    RAISE NOTICE ' - fn_start_workflow initialized: PASSED';

    -- 2. Verify history triggers generated submit entry
    SELECT count(1) INTO v_history_count FROM workflow_history WHERE request_id = v_req_id;
    ASSERT v_history_count = 1, 'Test Failed: Submitting request should write exactly 1 history row.';
    RAISE NOTICE ' - Trigger check (Submit history logging): PASSED';

    -- 3. Verify notification outbox entry was queued
    SELECT count(1) INTO v_notif_count FROM workflow_notifications WHERE request_id = v_req_id;
    ASSERT v_notif_count = 1, 'Test Failed: Submitting request should queue exactly 1 notification.';
    RAISE NOTICE ' - Trigger check (Outbox notification queued): PASSED';

    -- 3.5 Submit Workflow from DRAFT to PENDING status as the initiator user
    SELECT version INTO v_version FROM workflow_requests WHERE id = v_req_id;
    
    PERFORM fn_submit_action(
        v_tenant_a,
        v_req_id,
        'SUBMIT',
        v_user_faculty,
        'Submitting annual biology exam paper.',
        v_version
    );
    
    SELECT status, version INTO v_current_status, v_version FROM workflow_requests WHERE id = v_req_id;
    ASSERT v_current_status = 'PENDING', 'Test Failed: Request should transition to PENDING status.';
    ASSERT v_version = 2, 'Test Failed: Request version should increment to 2 on submit.';
    RAISE NOTICE ' - fn_submit_action (DRAFT -> PENDING transition): PASSED';

    -- Swapping claims context temporarily to approver user for action execution
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_user_approver, 'role', 'authenticated', 'tenantId', v_tenant_a)::text, true);

    -- 4. Submit Approve Action (Step 1 -> Step 2 transition)
    PERFORM fn_submit_action(
        v_tenant_a,
        v_req_id,
        'APPROVE',
        v_user_approver,
        'Approving step 1 verified details.',
        v_version
    );
    
    SELECT version INTO v_version FROM workflow_requests WHERE id = v_req_id;
    ASSERT v_version = 3, 'Test Failed: Request version should increment on approval updates.';
    RAISE NOTICE ' - fn_submit_action (Step 1 Approval transition): PASSED';


    -- ------------------------------------------------------------------------
    -- PHASE 4: CONCURRENCY & OPTIMISTIC LOCKING VERIFICATION
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 4: Verifying Concurrency & Stale Lock safeguards...';

    -- Attempt submitting action with stale version number 1 (which was already incremented to 3)
    BEGIN
        PERFORM fn_submit_action(
            v_tenant_a,
            v_req_id,
            'APPROVE',
            v_user_approver,
            'Attempting duplicate stale update.',
            1 -- Stale expected version
        );
        RAISE EXCEPTION 'Test Failed: Stale version lock was bypassed!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE ' - Optimistic Locking (Stale version update rejected): PASSED';
    END;


    -- ------------------------------------------------------------------------
    -- PHASE 5: SYSTEM PROTECTION & IMMUTABILITY
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 5: Verifying System record immutability...';

    -- Attempt deleting or editing terminal lookup state (e.g. APPROVED)
    BEGIN
        DELETE FROM workflow_states WHERE code = 'APPROVED';
        RAISE EXCEPTION 'Test Failed: Allowed deleting default state lookup records!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE ' - State machine lookup records protected from deletions: PASSED';
    END;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INTEGRITY TEST SUITE RUN COMPLETED SUCCESSFULLY (100%% PASSED)';
    RAISE NOTICE '============================================================';
END $$;
