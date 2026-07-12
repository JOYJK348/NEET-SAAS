-- ============================================================================
-- File       : 009_workflow_notifications.sql
-- Module     : Workflow
-- Purpose    : Outbox notification queue table for asynchronous workflow notifications processing.
-- Depends On : workflow_requests
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_notifications CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    
    recipient_user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'EMAIL',
    
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    retry_count SMALLINT NOT NULL DEFAULT 0,
    max_retry SMALLINT NOT NULL DEFAULT 3,
    last_attempt TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    error_log TEXT,
    
    -- Audit Stamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    version INT NOT NULL DEFAULT 1,
    metadata JSONB,
    
    -- Inline constraints & validations
    CONSTRAINT chk_workflow_notifications_type CHECK (notification_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    CONSTRAINT chk_workflow_notifications_status CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    CONSTRAINT chk_workflow_notifications_retry CHECK (retry_count >= 0),
    CONSTRAINT chk_workflow_notifications_max CHECK (max_retry >= retry_count),
    CONSTRAINT chk_workflow_notifications_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_notifications_version CHECK (version > 0)
);

-- 3. Comments
COMMENT ON TABLE workflow_notifications IS 'Notification queue outbox table mapped to workflow state transitions for asynchronous workers consumption.';
COMMENT ON COLUMN workflow_notifications.status IS 'Processing status state (PENDING, SENT, or FAILED).';
COMMENT ON COLUMN workflow_notifications.max_retry IS 'Maximum execution limit configured before worker marks task failed.';
COMMENT ON COLUMN workflow_notifications.last_attempt IS 'Timestamp marking the last processed try action.';
