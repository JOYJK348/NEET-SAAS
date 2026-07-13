-- ============================================================================
-- File       : 001_workflow_engine_seeds.sql
-- Module     : Workflow
-- Purpose    : Seeds default states, actions, transitions, and template pipelines.
-- Depends On : workflow_states, workflow_actions, workflow_transitions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_wf_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
    -- Resolve active tenant
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 1. Seed lookup catalog states
    INSERT INTO workflow_states (code, name, is_initial, is_terminal, color, icon)
    VALUES
        ('DRAFT', 'Draft State', true, false, 'text-gray-500', 'pencil-line'),
        ('PENDING', 'Pending Approval', false, false, 'text-amber-500', 'clock'),
        ('APPROVED', 'Approved & Published', false, true, 'text-green-500', 'check-circle'),
        ('REJECTED', 'Rejected Status', false, true, 'text-red-500', 'x-circle'),
        ('CHANGES_REQUESTED', 'Request Changes', false, false, 'text-blue-500', 'alert-circle'),
        ('CANCELLED', 'Cancelled Request', false, true, 'text-gray-400', 'ban')
    ON CONFLICT (code) DO NOTHING;

    -- 2. Seed lookup catalog actions
    INSERT INTO workflow_actions (code, name, action_category, description)
    VALUES
        ('SUBMIT', 'Submit for Review', 'USER', 'Initial submission transition'),
        ('APPROVE', 'Approve Item', 'USER', 'Moves request to next step or completes it'),
        ('REJECT', 'Reject Request', 'USER', 'Terminal rejection path'),
        ('RETURN', 'Request Changes', 'USER', 'Returns record to draft for corrections'),
        ('DELEGATE', 'Delegate approval', 'USER', 'Reassigns reviewer temporal limits'),
        ('ESCALATE', 'Auto Escalation', 'SYSTEM', 'SLA timeout auto-forward transition'),
        ('CANCEL', 'Cancel Submission', 'USER', 'Safely aborts workflow queue')
    ON CONFLICT (code) DO NOTHING;

    -- 3. Seed template workflow configs
    INSERT INTO workflows (id, tenant_id, workflow_code, workflow_version, name, description, allow_parallel, allow_cancel, auto_complete, is_active)
    VALUES (
        v_wf_id, v_tenant_id, 'EXAM_PUBLISH', 1, 'Exam Publishing Workflow', 'Standard multi-step verification pipeline before exam publishing', false, true, false, true
    ) ON CONFLICT (tenant_id, workflow_code, workflow_version) DO NOTHING;

    -- 4. Seed allowed Transitions (with condition guards and event hooks)
    INSERT INTO workflow_transitions (tenant_id, workflow_id, from_status, to_status, action_code, requires_comment, condition_expression, event_name, transition_name)
    VALUES
        (v_tenant_id, v_wf_id, 'DRAFT', 'PENDING', 'SUBMIT', false, NULL, 'workflow.submitted', 'Submit for approval'),
        (v_tenant_id, v_wf_id, 'PENDING', 'APPROVED', 'APPROVE', false, NULL, 'workflow.completed', 'Approve transaction step'),
        (v_tenant_id, v_wf_id, 'PENDING', 'REJECTED', 'REJECT', true, NULL, 'workflow.rejected', 'Reject transaction step'),
        (v_tenant_id, v_wf_id, 'PENDING', 'CHANGES_REQUESTED', 'RETURN', true, NULL, 'workflow.changes_requested', 'Return to author for changes'),
        (v_tenant_id, v_wf_id, 'CHANGES_REQUESTED', 'PENDING', 'SUBMIT', false, NULL, 'workflow.resubmitted', 'Re-submit corrected version'),
        (v_tenant_id, v_wf_id, 'PENDING', 'CANCELLED', 'CANCEL', false, NULL, 'workflow.cancelled', 'Cancel request')
    ON CONFLICT (tenant_id, workflow_id, from_status, action_code, to_status) DO NOTHING;

    -- 5. Seed workflow steps configurations
    INSERT INTO workflow_steps (tenant_id, workflow_id, step_order, step_name, step_type, is_optional, allow_skip, required_permission, assignment_strategy, timeout_hours, escalation_strategy)
    VALUES
        (v_tenant_id, v_wf_id, 1, 'Faculty Draft verification', 'APPROVAL', false, false, 'exams.question.approve', 'PERMISSION', 48, 'NEXT_APPROVER'),
        (v_tenant_id, v_wf_id, 2, 'Principal Final Sign-off', 'APPROVAL', false, false, 'exams.mock.approve', 'PERMISSION', 24, 'TENANT_ADMIN')
    ON CONFLICT (tenant_id, workflow_id, step_order) DO NOTHING;

END $$;
