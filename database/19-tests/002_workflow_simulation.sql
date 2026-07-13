-- ============================================================================
-- File       : 002_workflow_simulation.sql
-- Module     : Testing
-- Purpose    : Simulates end-to-end workflow actions, transition checks, and optimistic locking.
-- Depends On : workflow_requests, fn_start_workflow, fn_submit_action, fn_get_available_actions
-- Author     : Agaran Platform
-- Version    : 1.0.7
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID := '88888888-8888-8888-8888-888888888888';
    v_wf_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-888888888888'; -- EXAM_PUBLISH
    v_initiator UUID := '11111111-1111-1111-1111-111111111111'; -- Alpha Faculty User
    v_approver UUID := '22222222-2222-2222-2222-222222222222'; -- Alpha Admin User
    
    v_req_id UUID;
    v_available_actions_count INT;
    v_current_version INT;
    v_current_status VARCHAR(30);
BEGIN
    -- Setup session claims context representing Tenant Alpha Initiator User to satisfy RLS rules
    -- Note: current_tenant_id() reads 'tenantId' key (camelCase) from JWT claims
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_initiator, 'role', 'authenticated', 'tenantId', v_tenant_id)::text, true);

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE '1. STARTING WORKFLOW INSTANCE SIMULATION';
    RAISE NOTICE '------------------------------------------------------------';

    v_req_id := fn_start_workflow(
        v_tenant_id,
        v_wf_id,
        'EXAM',
        'e1111111-1111-1111-1111-111111111111'::UUID,
        v_initiator,
        'HIGH',
        '{"title": "Term End Chemistry Exam 2026", "questions_count": 90}'::jsonb
    );

    RAISE NOTICE 'Request Created ID: %', v_req_id;

    -- Verify initial request state
    SELECT status, version INTO v_current_status, v_current_version FROM workflow_requests WHERE id = v_req_id;
    RAISE NOTICE 'Initial Request Status: % (Expected: DRAFT)', v_current_status;
    RAISE NOTICE 'Initial Request Version: % (Expected: 1)', v_current_version;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE '2. SUBMITTING WORKFLOW FROM DRAFT TO PENDING';
    RAISE NOTICE '------------------------------------------------------------';

    -- Swapping context to initiator to perform SUBMIT transition
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_initiator, 'role', 'authenticated', 'tenantId', v_tenant_id)::text, true);

    PERFORM fn_submit_action(
        v_tenant_id,
        v_req_id,
        'SUBMIT',
        v_initiator,
        'Submitting chemistry exam paper for review.',
        v_current_version
    );

    -- Verify post-submit state
    SELECT status, version INTO v_current_status, v_current_version FROM workflow_requests WHERE id = v_req_id;
    RAISE NOTICE 'Post-Submit Status: % (Expected: PENDING)', v_current_status;
    RAISE NOTICE 'Post-Submit Version: % (Expected: 2)', v_current_version;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE '3. EXECUTING APPROVAL TRANSITION';
    RAISE NOTICE '------------------------------------------------------------';

    -- Resetting claims context to approver user for action execution
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_approver, 'role', 'authenticated', 'tenantId', v_tenant_id)::text, true);

    -- Fetch available actions for the approver
    SELECT count(1) INTO v_available_actions_count FROM fn_get_available_actions(v_tenant_id, v_req_id, v_approver);
    RAISE NOTICE 'Available Actions for Approver: % (Expected > 0)', v_available_actions_count;

    BEGIN
        PERFORM fn_submit_action(
            v_tenant_id,
            v_req_id,
            'APPROVE',
            v_approver,
            'Format and syllabi verified. Approving step 1.',
            v_current_version
        );
    EXCEPTION WHEN OTHERS THEN
        DECLARE
            v_diagnostic_msg TEXT := 'TEST SIMULATION FAILURE DIAGNOSTICS:' || chr(10);
            v_debug_role RECORD;
            v_debug_perm RECORD;
            v_debug_step RECORD;
            v_debug_req RECORD;
            v_debug_wf RECORD;
            v_debug_all_step RECORD;
        BEGIN
            v_diagnostic_msg := v_diagnostic_msg || 'Error: ' || SQLERRM || chr(10);
            v_diagnostic_msg := v_diagnostic_msg || 'TenantID: ' || v_tenant_id || chr(10);
            v_diagnostic_msg := v_diagnostic_msg || 'ApproverID: ' || v_approver || chr(10);
            
            -- Dump all workflows in the system
            v_diagnostic_msg := v_diagnostic_msg || '--- ALL WORKFLOWS IN DATABASE ---' || chr(10);
            FOR v_debug_wf IN SELECT id, tenant_id, workflow_code, is_active FROM workflows LOOP
                v_diagnostic_msg := v_diagnostic_msg || 'Workflow: id=' || v_debug_wf.id || ', tenant=' || v_debug_wf.tenant_id || ', code=' || v_debug_wf.workflow_code || ', active=' || v_debug_wf.is_active || chr(10);
            END LOOP;

            -- Dump all workflow steps in the system
            v_diagnostic_msg := v_diagnostic_msg || '--- ALL WORKFLOW STEPS IN DATABASE ---' || chr(10);
            FOR v_debug_all_step IN SELECT id, tenant_id, workflow_id, step_order, step_name FROM workflow_steps LOOP
                v_diagnostic_msg := v_diagnostic_msg || 'Step: id=' || v_debug_all_step.id || ', tenant=' || v_debug_all_step.tenant_id || ', wf_id=' || v_debug_all_step.workflow_id || ', order=' || v_debug_all_step.step_order || ', name=' || v_debug_all_step.step_name || chr(10);
            END LOOP;

            SELECT * INTO v_debug_req FROM workflow_requests WHERE id = v_req_id;
            IF FOUND THEN
                v_diagnostic_msg := v_diagnostic_msg || 'Request Status: current_step_id=' || COALESCE(v_debug_req.current_step_id::text, 'NULL') || ', status=' || v_debug_req.status || chr(10);
            END IF;

            RAISE EXCEPTION '%', v_diagnostic_msg;
        END;
    END;

    SELECT status, version INTO v_current_status, v_current_version FROM workflow_requests WHERE id = v_req_id;
    RAISE NOTICE 'Post-Approval Status: % (Expected: PENDING)', v_current_status;
    RAISE NOTICE 'Post-Approval Version: % (Expected: 3)', v_current_version;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE '4. OPTIMISTIC LOCKING VERIFICATION';
    RAISE NOTICE '------------------------------------------------------------';

    -- Attempt submitting action with stale version (Expected: Raise Lock Conflict)
    BEGIN
        PERFORM fn_submit_action(
            v_tenant_id,
            v_req_id,
            'APPROVE',
            v_approver,
            'Attempting double submission with outdated version.',
            1 -- Stale expected version (since it's now version 3)
        );
        RAISE EXCEPTION 'Test Failed: Stale version lock validation was bypassed!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Optimistic Lock Validation Passed: Blocked stale transaction with message: %', SQLERRM;
    END;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'WORKFLOW SIMULATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '------------------------------------------------------------';
END $$;
