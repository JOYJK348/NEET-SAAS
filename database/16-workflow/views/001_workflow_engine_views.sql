-- ============================================================================
-- File       : 001_workflow_engine_views.sql
-- Module     : Workflow
-- Purpose    : Core views mapping timelines, statistics, and pending queues.
-- Depends On : workflow_requests, workflow_history, workflows
-- Author     : Agaran Platform
-- Version    : 1.1.0
-- ============================================================================

-- 1. Pending Workflows Queue View
CREATE OR REPLACE VIEW v_pending_workflows AS
SELECT 
    wr.tenant_id,
    wr.id AS request_id,
    w.name AS workflow_name,
    wr.entity_type,
    wr.entity_id,
    wr.priority,
    wr.status,
    ws.step_name AS current_step_name,
    wr.current_assignee_user_id,
    wr.current_assignee_group,
    wr.started_at,
    wr.deadline_at
FROM workflow_requests wr
JOIN workflows w ON w.id = wr.workflow_id
LEFT JOIN workflow_steps ws ON ws.id = wr.current_step_id
WHERE wr.status = 'PENDING' AND wr.deleted_at IS NULL;

-- 2. My Tasks View (personalized for a specific user)
CREATE OR REPLACE VIEW v_my_tasks AS
SELECT 
    wr.tenant_id,
    wr.id AS request_id,
    w.name AS workflow_name,
    wr.entity_type,
    wr.entity_id,
    wr.entity_version,
    wr.priority,
    wr.status,
    ws.step_name AS current_step_name,
    ws.step_order,
    wr.current_assignee_user_id,
    wr.current_assignee_group,
    wr.initiator_id,
    wr.started_at,
    wr.deadline_at,
    wr.version AS row_version,
    CASE 
        WHEN wr.deadline_at IS NOT NULL AND wr.deadline_at <= NOW() THEN true 
        ELSE false 
    END AS is_overdue,
    CASE 
        WHEN wr.deadline_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (wr.deadline_at - NOW())) / 3600 
        ELSE NULL 
    END AS remaining_hours
FROM workflow_requests wr
JOIN workflows w ON w.id = wr.workflow_id
LEFT JOIN workflow_steps ws ON ws.id = wr.current_step_id
WHERE wr.status = 'PENDING' AND wr.deleted_at IS NULL;

-- 3. History Timeline Audit View
CREATE OR REPLACE VIEW v_workflow_timeline AS
SELECT 
    wh.tenant_id,
    wh.request_id,
    wh.from_status,
    wh.to_status,
    wh.action_code,
    wh.notes,
    wh.performed_by,
    wh.created_at AS transition_time
FROM workflow_history wh
ORDER BY wh.created_at ASC;

-- 4. Workflow Analytics Statistics View
CREATE OR REPLACE VIEW v_workflow_statistics AS
SELECT 
    tenant_id,
    status,
    priority,
    count(1) AS total_requests
FROM workflow_requests
WHERE deleted_at IS NULL
GROUP BY tenant_id, status, priority;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON VIEW v_pending_workflows IS 'Unified pending review tasks queue lists.';
COMMENT ON VIEW v_my_tasks IS 'Personalized task list with row_version for optimistic locking, overdue flag, and remaining SLA hours.';
COMMENT ON VIEW v_workflow_timeline IS 'History timeline sequence logs for dashboard timeline widgets.';
