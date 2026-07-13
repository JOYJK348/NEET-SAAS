-- ============================================================================
-- File       : 001_workflow_engine_procedures.sql
-- Module     : Workflow
-- Purpose    : Centralized database procedures for transaction orchestration.
-- Depends On : workflow_requests, workflow_history, workflow_notifications
-- Author     : Agaran Platform
-- Version    : 1.1.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SLA Timeout Auto-Escalation Orchestration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_auto_escalation(
    p_tenant_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_req RECORD;
    v_esc_step_id UUID;
    v_strategy VARCHAR(50);
    v_next_assignee UUID;
BEGIN
    -- Query pending requests that have exceeded their deadline
    FOR v_req IN 
        SELECT wr.id AS request_id, wr.current_step_id, ws.escalation_step_id, ws.escalation_strategy
        FROM workflow_requests wr
        JOIN workflow_steps ws ON ws.id = wr.current_step_id
        WHERE wr.tenant_id = p_tenant_id
          AND wr.status = 'PENDING'
          AND wr.deadline_at IS NOT NULL
          AND wr.deadline_at <= NOW()
          AND wr.deleted_at IS NULL
    LOOP
        -- If an escalation step is configured, route to it
        IF v_req.escalation_step_id IS NOT NULL THEN
            
            -- Resolve assignee based on escalation strategy
            IF v_req.escalation_strategy = 'TENANT_ADMIN' THEN
                -- Find first active tenant admin user ID
                SELECT id INTO v_next_assignee 
                FROM users 
                WHERE tenant_id = p_tenant_id 
                  AND user_type = 'STAFF' 
                  AND deleted_at IS NULL 
                LIMIT 1;
            ELSE
                v_next_assignee := NULL; -- Dynamic re-evaluation
            END IF;

            -- Update Request
            UPDATE workflow_requests
            SET current_step_id = v_req.escalation_step_id,
                current_assignee_user_id = v_next_assignee,
                version = version + 1,
                updated_at = NOW()
            WHERE id = v_req.request_id;

            -- Log to Escalation Ledger
            INSERT INTO workflow_escalations (
                tenant_id, request_id, escalated_from_step_id, escalated_to_step_id, escalation_level, target_strategy, after_minutes, escalated_at
            ) VALUES (
                p_tenant_id, v_req.request_id, v_req.current_step_id, v_req.escalation_step_id, 1, v_req.escalation_strategy, 0, NOW()
            );

            -- Log to History
            INSERT INTO workflow_history (
                tenant_id, request_id, from_step_id, to_step_id, action_code, from_status, to_status, performed_by, notes
            ) VALUES (
                p_tenant_id, v_req.request_id, v_req.current_step_id, v_req.escalation_step_id, 'ESCALATE', 'PENDING', 'PENDING', '00000000-0000-0000-0000-000000000000'::UUID, 'SLA timeout auto-escalation triggered'
            );

        END IF;
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Retry Notification Delivery Outbox Queue (with Backoff + Dead Letter)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_retry_notifications(
    p_tenant_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_notif RECORD;
BEGIN
    -- Reset FAILED notifications that are due for retry to PENDING
    FOR v_notif IN 
        SELECT id, retry_count, max_retry
        FROM workflow_notifications
        WHERE tenant_id = p_tenant_id
          AND status = 'FAILED'
          AND retry_count < max_retry
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
          AND deleted_at IS NULL
    LOOP
        -- Increment retry stats and return to PENDING
        UPDATE workflow_notifications
        SET status = 'PENDING',
            retry_count = retry_count + 1,
            last_attempt = NOW(),
            next_retry_at = NOW() + ((retry_count + 1) ^ 2 * interval '1 minute') -- Exponential backoff
        WHERE id = v_notif.id;
    END LOOP;

    -- Move max-retry-exceeded notifications to Dead Letter Queue
    WITH dlq_moved AS (
        DELETE FROM workflow_notifications
        WHERE tenant_id = p_tenant_id
          AND status = 'FAILED'
          AND retry_count >= max_retry
          AND deleted_at IS NULL
        RETURNING
            id, tenant_id, request_id, recipient_user_id, notification_type,
            title, body, retry_count, max_retry, error_log, created_at, metadata
    )
    INSERT INTO workflow_notification_dead_letters (
        tenant_id, request_id, original_notification_id, recipient_user_id,
        notification_type, title, body, retry_count, max_retry, last_error, dead_at, metadata
    )
    SELECT
        tenant_id, request_id, id, recipient_user_id,
        notification_type, title, body, retry_count, max_retry, error_log, NOW(),
        COALESCE(metadata, '{}'::JSONB) || jsonb_build_object('moved_from', 'sp_retry_notifications', 'moved_at', NOW())
    FROM dlq_moved;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Purge Dead Letter Queue (after manual inspection)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_purge_dead_letters(
    p_tenant_id UUID,
    p_older_than INTERVAL DEFAULT interval '90 days'
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM workflow_notification_dead_letters
    WHERE tenant_id = p_tenant_id
      AND dead_at < NOW() - p_older_than;
END;
$$;
