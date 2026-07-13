-- ============================================================================
-- File       : 001_workflow_engine_triggers.sql
-- Module     : Workflow
-- Purpose    : Database triggers for audit logs and asynchronous notifications outbox.
-- Depends On : workflow_requests, workflow_history, workflow_notifications
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Touch Audit Columns Triggers
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_tab RECORD;
BEGIN
    FOR v_tab IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE 'workflow_%'
          AND table_name NOT IN ('workflow_states', 'workflow_actions', 'workflow_history', 'workflow_notifications', 'workflow_notification_dead_letters')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_biu_%I_touch_audit ON %I;
            CREATE TRIGGER trg_biu_%I_touch_audit
                BEFORE INSERT OR UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION touch_audit_columns();
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. History Change Notification Generator
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_workflow_history_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipient UUID;
    v_title VARCHAR(200);
    v_body TEXT;
BEGIN
    -- Resolve recipient user (usually the initiator/submitter of the request)
    SELECT initiator_id INTO v_recipient
    FROM workflow_requests
    WHERE id = NEW.request_id;

    IF v_recipient IS NOT NULL THEN
        v_title := format('Workflow Update: Request status changed to %s', NEW.to_status);
        v_body  := format('Your request status moved from %s to %s via action %s. Remarks: %s', 
                          NEW.from_status, NEW.to_status, NEW.action_code, COALESCE(NEW.notes, 'None'));

        -- Insert outbox notification queue with initial retry schedule
        INSERT INTO workflow_notifications (
            tenant_id, request_id, recipient_user_id, notification_type, title, body, status, next_retry_at
        ) VALUES (
            NEW.tenant_id, NEW.request_id, v_recipient, 'EMAIL', v_title, v_body, 'PENDING', NOW() + interval '5 minutes'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_workflow_history ON workflow_history;
CREATE TRIGGER trg_after_insert_workflow_history
    AFTER INSERT ON workflow_history
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_workflow_history_notification();
