-- ============================================================================
-- File       : 001_workflow_engine_functions.sql
-- Module     : Workflow
-- Purpose    : Centralized database function engine for workflow state machine.
-- Depends On : workflow_requests, workflow_steps, workflow_transitions, workflow_states
-- Author     : Agaran Platform
-- Version    : 1.1.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Check Allowed Transition
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_can_transition(
    p_tenant_id UUID,
    p_workflow_id UUID,
    p_from_status VARCHAR,
    p_action_code VARCHAR,
    p_to_status VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM workflow_transitions
        WHERE tenant_id = p_tenant_id
          AND workflow_id = p_workflow_id
          AND from_status = p_from_status
          AND action_code = p_action_code
          AND to_status = p_to_status
          AND deleted_at IS NULL
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Verify User Execution Permission
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_can_execute_action(
    p_tenant_id UUID,
    p_request_id UUID,
    p_user_id UUID,
    p_action_code VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_req_perm VARCHAR(100);
    v_current_step_id UUID;
    v_assignee_user_id UUID;
    v_strategy VARCHAR(50);
BEGIN
    -- Get current request state details
    SELECT current_step_id, current_assignee_user_id
    INTO v_current_step_id, v_assignee_user_id
    FROM workflow_requests
    WHERE id = p_request_id AND tenant_id = p_tenant_id;

    -- If no current step, only platform administrators or initiators can cancel/manage
    IF v_current_step_id IS NULL THEN
        RETURN current_user_is_super_admin() OR EXISTS (
            SELECT 1 FROM workflow_requests WHERE id = p_request_id AND initiator_id = p_user_id
        );
    END IF;

    -- Fetch step validations
    SELECT required_permission, assignment_strategy
    INTO v_req_perm, v_strategy
    FROM workflow_steps
    WHERE id = v_current_step_id;

    -- If assigned to a specific user, check identity
    IF v_assignee_user_id IS NOT NULL AND v_assignee_user_id <> p_user_id THEN
        RETURN FALSE;
    END IF;

    -- Evaluate capability permission dynamically via authorization engine
    RETURN current_user_is_super_admin() 
        OR fn_has_permission(p_tenant_id, p_user_id, v_req_perm) = TRUE;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Get Current Assignee for a Request
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_current_assignee(
    p_request_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_assignee UUID;
BEGIN
    SELECT current_assignee_user_id INTO v_assignee
    FROM workflow_requests
    WHERE id = p_request_id;
    RETURN v_assignee;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Check if Workflow Request is Completed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_is_workflow_completed(
    p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_terminal BOOLEAN;
BEGIN
    SELECT ws.is_terminal INTO v_terminal
    FROM workflow_requests wr
    JOIN workflow_states ws ON ws.code = wr.status
    WHERE wr.id = p_request_id;
    RETURN COALESCE(v_terminal, false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Get Available Actions for UI
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_available_actions(
    p_tenant_id UUID,
    p_request_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    action_code VARCHAR(30),
    action_name VARCHAR(100),
    action_category VARCHAR(20),
    requires_comment BOOLEAN,
    condition_expression TEXT,
    event_name VARCHAR(100),
    transition_name VARCHAR(100)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_workflow_id UUID;
    v_current_status VARCHAR(30);
    v_snapshot JSONB;
BEGIN
    SELECT workflow_id, status, entity_snapshot
    INTO v_workflow_id, v_current_status, v_snapshot
    FROM workflow_requests
    WHERE id = p_request_id AND tenant_id = p_tenant_id;

    RETURN QUERY
    SELECT 
        a.code,
        a.name,
        a.action_category,
        wt.requires_comment,
        wt.condition_expression,
        wt.event_name,
        wt.transition_name
    FROM workflow_transitions wt
    JOIN workflow_actions a ON a.code = wt.action_code
    WHERE wt.tenant_id = p_tenant_id
      AND wt.workflow_id = v_workflow_id
      AND wt.from_status = v_current_status
      AND wt.deleted_at IS NULL
      AND fn_can_execute_action(p_tenant_id, p_request_id, p_user_id, wt.action_code)
    ORDER BY a.name;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Start Workflow Instance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_start_workflow(
    p_tenant_id UUID,
    p_workflow_id UUID,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_initiator_id UUID,
    p_priority VARCHAR,
    p_snapshot JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_id UUID;
    v_initial_state VARCHAR(30);
    v_first_step_id UUID;
    v_req_perm VARCHAR(100);
    v_ver INT;
BEGIN
    -- Resolve initial state
    SELECT code INTO v_initial_state FROM workflow_states WHERE is_initial = TRUE LIMIT 1;
    IF v_initial_state IS NULL THEN
        v_initial_state := 'DRAFT';
    END IF;

    -- Fetch current version of workflow
    SELECT workflow_version INTO v_ver FROM workflows WHERE id = p_workflow_id;

    -- Resolve first configured step
    SELECT id, required_permission INTO v_first_step_id, v_req_perm
    FROM workflow_steps
    WHERE workflow_id = p_workflow_id 
      AND tenant_id = p_tenant_id 
      AND step_order = 1 
      AND deleted_at IS NULL;

    -- Insert request queue
    INSERT INTO workflow_requests (
        tenant_id, workflow_id, workflow_version, entity_type, entity_id, entity_snapshot,
        current_step_id, status, priority, initiator_id, current_assignee_user_id, started_at
    ) VALUES (
        p_tenant_id, p_workflow_id, v_ver, p_entity_type, p_entity_id, p_snapshot,
        v_first_step_id, v_initial_state, p_priority, p_initiator_id, NULL, NOW()
    ) RETURNING id INTO v_request_id;

    -- Log transaction history
    INSERT INTO workflow_history (
        tenant_id, request_id, from_step_id, to_step_id, action_code, from_status, to_status, performed_by, notes
    ) VALUES (
        p_tenant_id, v_request_id, NULL, v_first_step_id, 'SUBMIT', v_initial_state, v_initial_state, p_initiator_id, 'Workflow request initialized'
    );

    RETURN v_request_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Submit Action Transition (with Optimistic Locking, Guards, Event Hooks)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_submit_action(
    p_tenant_id UUID,
    p_request_id UUID,
    p_action_code VARCHAR,
    p_performed_by UUID,
    p_notes TEXT DEFAULT NULL,
    p_expected_version INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wf_id UUID;
    v_current_status VARCHAR(30);
    v_next_status VARCHAR(30);
    v_current_step_id UUID;
    v_next_step_id UUID;
    v_curr_order SMALLINT;
    v_req_comment BOOLEAN;
    v_terminal BOOLEAN;
    v_condition TEXT;
    v_event_name VARCHAR(100);
    v_snapshot JSONB;
    v_condition_result BOOLEAN;
    v_current_version INT;
BEGIN
    -- Fetch request context with current version for optimistic locking
    SELECT workflow_id, status, current_step_id, entity_snapshot, version
    INTO v_wf_id, v_current_status, v_current_step_id, v_snapshot, v_current_version
    FROM workflow_requests
    WHERE id = p_request_id AND tenant_id = p_tenant_id;

    -- Optimistic Locking check
    IF p_expected_version IS NOT NULL AND v_current_version <> p_expected_version THEN
        RAISE EXCEPTION 'Optimistic Lock Conflict: Request was modified by another user. Expected version %, current version %. Refresh and retry.', p_expected_version, v_current_version;
    END IF;

    -- Check action execution permissions
    IF NOT fn_can_execute_action(p_tenant_id, p_request_id, p_performed_by, p_action_code) THEN
        RAISE EXCEPTION 'Access Denied: User lacks permissions to perform action on current request step.';
    END IF;

    -- Fetch valid transition path with guard condition and event hook
    SELECT to_status, requires_comment, condition_expression, event_name
    INTO v_next_status, v_req_comment, v_condition, v_event_name
    FROM workflow_transitions
    WHERE tenant_id = p_tenant_id
      AND workflow_id = v_wf_id
      AND from_status = v_current_status
      AND action_code = p_action_code
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_next_status IS NULL THEN
        RAISE EXCEPTION 'Invalid State: Action transition path from % with action % is not registered.', v_current_status, p_action_code;
    END IF;

    -- Verify comment requirement constraint
    IF v_req_comment = TRUE AND (p_notes IS NULL OR length(trim(p_notes)) = 0) THEN
        RAISE EXCEPTION 'Validation Check: Comments are mandatory for action transition %.', p_action_code;
    END IF;

    -- Evaluate transition guard condition
    IF v_condition IS NOT NULL THEN
        BEGIN
            EXECUTE format('SELECT %s', v_condition) INTO v_condition_result USING v_snapshot;
            IF v_condition_result IS NULL OR v_condition_result = FALSE THEN
                RAISE EXCEPTION 'Transition Guard Denied: Condition "%s" evaluated to false for action %.', v_condition, p_action_code;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Transition Guard Error: Failed to evaluate condition "%s" for action %. Details: %', v_condition, p_action_code, SQLERRM;
        END;
    END IF;

    -- Resolve next step sequence
    IF p_action_code = 'APPROVE' AND v_current_step_id IS NOT NULL THEN
        SELECT step_order INTO v_curr_order FROM workflow_steps WHERE id = v_current_step_id;
        
        SELECT id INTO v_next_step_id
        FROM workflow_steps
        WHERE workflow_id = v_wf_id AND step_order > v_curr_order AND deleted_at IS NULL
        ORDER BY step_order ASC LIMIT 1;
    ELSIF p_action_code = 'REJECT' OR p_action_code = 'RETURN' THEN
        v_next_step_id := NULL;
    ELSE
        v_next_step_id := v_current_step_id;
    END IF;

    -- Check terminal state
    SELECT is_terminal INTO v_terminal FROM workflow_states WHERE code = v_next_status;

    -- Update Request Queue with optimistic locking (version increment)
    UPDATE workflow_requests
    SET status = v_next_status,
        current_step_id = CASE WHEN v_terminal THEN NULL ELSE COALESCE(v_next_step_id, current_step_id) END,
        completed_at = CASE WHEN v_terminal THEN NOW() ELSE NULL END,
        current_assignee_user_id = NULL,
        version = version + 1,
        updated_at = NOW(),
        updated_by = p_performed_by
    WHERE id = p_request_id;

    -- Log transaction history
    INSERT INTO workflow_history (
        tenant_id, request_id, from_step_id, to_step_id, action_code, from_status, to_status,
        from_assignee_user_id, to_assignee_user_id, performed_by, notes, metadata
    ) VALUES (
        p_tenant_id, p_request_id, v_current_step_id, v_next_step_id, p_action_code, v_current_status, v_next_status,
        fn_get_current_assignee(p_request_id), NULL, p_performed_by, p_notes,
        CASE WHEN v_event_name IS NOT NULL THEN jsonb_build_object('event', v_event_name) ELSE NULL END
    );

    -- Fire event hook via PostgreSQL NOTIFY for external integration
    IF v_event_name IS NOT NULL THEN
        PERFORM pg_notify(v_event_name, json_build_object(
            'request_id', p_request_id,
            'tenant_id', p_tenant_id,
            'action_code', p_action_code,
            'from_status', v_current_status,
            'to_status', v_next_status,
            'performed_by', p_performed_by,
            'timestamp', NOW()
        )::TEXT);
    END IF;

    RETURN TRUE;
END;
$$;
