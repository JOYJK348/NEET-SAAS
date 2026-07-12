-- ============================================================================
-- File       : 013_workflow_notification_dead_letters.sql
-- Module     : Workflow
-- Purpose    : Dead letter queue for notifications exceeding max retry count.
-- Depends On : workflow_requests
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS workflow_notification_dead_letters CASCADE;

CREATE TABLE workflow_notification_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    original_notification_id UUID NOT NULL,
    
    recipient_user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'EMAIL',
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    
    retry_count SMALLINT NOT NULL DEFAULT 0,
    max_retry SMALLINT NOT NULL DEFAULT 3,
    last_error TEXT,
    dead_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB,
    
    CONSTRAINT chk_dlq_notification_type CHECK (notification_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    CONSTRAINT chk_dlq_retry CHECK (retry_count >= 0),
    CONSTRAINT chk_dlq_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE workflow_notification_dead_letters IS 'Dead letter queue capturing notifications that exhausted all retry attempts for manual inspection and remediation.';
COMMENT ON COLUMN workflow_notification_dead_letters.original_notification_id IS 'References the original notification record that was moved to DLQ.';
COMMENT ON COLUMN workflow_notification_dead_letters.dead_at IS 'Timestamp when the notification was moved to dead letter queue.';
