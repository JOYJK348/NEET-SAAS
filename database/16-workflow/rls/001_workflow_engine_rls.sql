-- ============================================================================
-- File       : 001_workflow_engine_rls.sql
-- Module     : Workflow
-- Purpose    : Centralized RLS policies setup for all workflow tables.
-- Depends On : workflows, workflow_steps, workflow_requests, workflow_history
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Lookup Catalogs (states, actions) open to read, system protect on write
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_workflow_states_select ON workflow_states;
CREATE POLICY policy_workflow_states_select ON workflow_states FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS policy_workflow_actions_select ON workflow_actions;
CREATE POLICY policy_workflow_actions_select ON workflow_actions FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 3. Workflows Configuration Policies (workflows, steps, transitions)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_workflows_select ON workflows;
CREATE POLICY policy_workflows_select ON workflows FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'platform.workflows.view'));

DROP POLICY IF EXISTS policy_workflows_insert ON workflows;
CREATE POLICY policy_workflows_insert ON workflows FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'platform.workflows.create'));

DROP POLICY IF EXISTS policy_workflows_update ON workflows;
CREATE POLICY policy_workflows_update ON workflows FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'platform.workflows.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'platform.workflows.edit', false));

DROP POLICY IF EXISTS policy_workflows_delete ON workflows;
CREATE POLICY policy_workflows_delete ON workflows FOR DELETE TO authenticated USING (false); -- Hard deletes strictly disabled

-- Steps
DROP POLICY IF EXISTS policy_workflow_steps_select ON workflow_steps;
CREATE POLICY policy_workflow_steps_select ON workflow_steps FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'platform.workflows.view'));

DROP POLICY IF EXISTS policy_workflow_steps_insert ON workflow_steps;
CREATE POLICY policy_workflow_steps_insert ON workflow_steps FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'platform.workflows.create'));

DROP POLICY IF EXISTS policy_workflow_steps_update ON workflow_steps;
CREATE POLICY policy_workflow_steps_update ON workflow_steps FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'platform.workflows.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'platform.workflows.edit', false));

DROP POLICY IF EXISTS policy_workflow_steps_delete ON workflow_steps;
CREATE POLICY policy_workflow_steps_delete ON workflow_steps FOR DELETE TO authenticated USING (false);

-- Transitions
DROP POLICY IF EXISTS policy_workflow_transitions_select ON workflow_transitions;
CREATE POLICY policy_workflow_transitions_select ON workflow_transitions FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'platform.workflows.view'));

DROP POLICY IF EXISTS policy_workflow_transitions_insert ON workflow_transitions;
CREATE POLICY policy_workflow_transitions_insert ON workflow_transitions FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'platform.workflows.create'));

DROP POLICY IF EXISTS policy_workflow_transitions_update ON workflow_transitions;
CREATE POLICY policy_workflow_transitions_update ON workflow_transitions FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'platform.workflows.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'platform.workflows.edit', false));

DROP POLICY IF EXISTS policy_workflow_transitions_delete ON workflow_transitions;
CREATE POLICY policy_workflow_transitions_delete ON workflow_transitions FOR DELETE TO authenticated USING (false);

-- ----------------------------------------------------------------------------
-- 4. Transactional Queue Policies (requests, history, comments, attachments)
-- ----------------------------------------------------------------------------
-- Requests
DROP POLICY IF EXISTS policy_workflow_requests_select ON workflow_requests;
CREATE POLICY policy_workflow_requests_select ON workflow_requests FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

DROP POLICY IF EXISTS policy_workflow_requests_insert ON workflow_requests;
CREATE POLICY policy_workflow_requests_insert ON workflow_requests FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'workflow.requests.create'));

DROP POLICY IF EXISTS policy_workflow_requests_update ON workflow_requests;
CREATE POLICY policy_workflow_requests_update ON workflow_requests FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false));

DROP POLICY IF EXISTS policy_workflow_requests_delete ON workflow_requests;
CREATE POLICY policy_workflow_requests_delete ON workflow_requests FOR DELETE TO authenticated USING (false);

-- History
DROP POLICY IF EXISTS policy_workflow_history_select ON workflow_history;
CREATE POLICY policy_workflow_history_select ON workflow_history FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

DROP POLICY IF EXISTS policy_workflow_history_insert ON workflow_history;
CREATE POLICY policy_workflow_history_insert ON workflow_history FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'workflow.requests.create'));

DROP POLICY IF EXISTS policy_workflow_history_update ON workflow_history;
CREATE POLICY policy_workflow_history_update ON workflow_history FOR UPDATE TO authenticated USING (false); -- Immutable

DROP POLICY IF EXISTS policy_workflow_history_delete ON workflow_history;
CREATE POLICY policy_workflow_history_delete ON workflow_history FOR DELETE TO authenticated USING (false); -- Immutable

-- Comments
DROP POLICY IF EXISTS policy_workflow_comments_select ON workflow_comments;
CREATE POLICY policy_workflow_comments_select ON workflow_comments FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

DROP POLICY IF EXISTS policy_workflow_comments_insert ON workflow_comments;
CREATE POLICY policy_workflow_comments_insert ON workflow_comments FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'workflow.requests.create'));

DROP POLICY IF EXISTS policy_workflow_comments_update ON workflow_comments;
CREATE POLICY policy_workflow_comments_update ON workflow_comments FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false));

DROP POLICY IF EXISTS policy_workflow_comments_delete ON workflow_comments;
CREATE POLICY policy_workflow_comments_delete ON workflow_comments FOR DELETE TO authenticated USING (false);

-- Attachments
DROP POLICY IF EXISTS policy_workflow_attachments_select ON workflow_attachments;
CREATE POLICY policy_workflow_attachments_select ON workflow_attachments FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

DROP POLICY IF EXISTS policy_workflow_attachments_insert ON workflow_attachments;
CREATE POLICY policy_workflow_attachments_insert ON workflow_attachments FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'workflow.requests.create'));

DROP POLICY IF EXISTS policy_workflow_attachments_update ON workflow_attachments;
CREATE POLICY policy_workflow_attachments_update ON workflow_attachments FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false));

DROP POLICY IF EXISTS policy_workflow_attachments_delete ON workflow_attachments;
CREATE POLICY policy_workflow_attachments_delete ON workflow_attachments FOR DELETE TO authenticated USING (false);

-- Notifications
DROP POLICY IF EXISTS policy_workflow_notifications_select ON workflow_notifications;
CREATE POLICY policy_workflow_notifications_select ON workflow_notifications FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

-- Delegations
DROP POLICY IF EXISTS policy_workflow_delegations_select ON workflow_delegations;
CREATE POLICY policy_workflow_delegations_select ON workflow_delegations FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

DROP POLICY IF EXISTS policy_workflow_delegations_insert ON workflow_delegations;
CREATE POLICY policy_workflow_delegations_insert ON workflow_delegations FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'workflow.requests.create'));

DROP POLICY IF EXISTS policy_workflow_delegations_update ON workflow_delegations;
CREATE POLICY policy_workflow_delegations_update ON workflow_delegations FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'workflow.requests.edit', false));

DROP POLICY IF EXISTS policy_workflow_delegations_delete ON workflow_delegations;
CREATE POLICY policy_workflow_delegations_delete ON workflow_delegations FOR DELETE TO authenticated USING (false);

-- Escalations
DROP POLICY IF EXISTS policy_workflow_escalations_select ON workflow_escalations;
CREATE POLICY policy_workflow_escalations_select ON workflow_escalations FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'workflow.requests.view'));

-- ----------------------------------------------------------------------------
-- 5. Dead Letter Queue (admin-only read, no direct write)
-- ----------------------------------------------------------------------------
ALTER TABLE workflow_notification_dead_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_dlq_notifications_select ON workflow_notification_dead_letters;
CREATE POLICY policy_dlq_notifications_select ON workflow_notification_dead_letters FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'platform.admin'));

DROP POLICY IF EXISTS policy_dlq_notifications_insert ON workflow_notification_dead_letters;
CREATE POLICY policy_dlq_notifications_insert ON workflow_notification_dead_letters FOR INSERT TO authenticated WITH CHECK (false); -- Only system procedures write

DROP POLICY IF EXISTS policy_dlq_notifications_update ON workflow_notification_dead_letters;
CREATE POLICY policy_dlq_notifications_update ON workflow_notification_dead_letters FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS policy_dlq_notifications_delete ON workflow_notification_dead_letters;
CREATE POLICY policy_dlq_notifications_delete ON workflow_notification_dead_letters FOR DELETE TO authenticated USING (fn_rls_can_update(tenant_id, 'platform.admin', false)); -- Admin purge only
