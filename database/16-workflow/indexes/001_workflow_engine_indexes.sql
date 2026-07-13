-- ============================================================================
-- File       : 001_workflow_engine_indexes.sql
-- Module     : Workflow
-- Purpose    : Query performance optimization indexes for all workflow tables.
-- Depends On : workflows, workflow_requests, workflow_history
-- Author     : Agaran Platform
-- Version    : 1.1.0
-- ============================================================================

-- 1. Index on workflow requests queue mapping priority and steps
CREATE INDEX IF NOT EXISTS idx_workflow_requests_q_priority
    ON workflow_requests (tenant_id, status, priority, current_step_id)
    WHERE deleted_at IS NULL;

-- 2. Composite index for dashboard filters (tenant + status + step + priority)
CREATE INDEX IF NOT EXISTS idx_workflow_requests_dashboard
    ON workflow_requests (tenant_id, status, current_step_id, priority)
    WHERE deleted_at IS NULL;

-- 3. Index on workflow steps tree order lookups
CREATE INDEX IF NOT EXISTS idx_workflow_steps_num_order
    ON workflow_steps (tenant_id, workflow_id, step_order)
    WHERE deleted_at IS NULL;

-- 4. Index on workflow transitions paths checks
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_from_to
    ON workflow_transitions (tenant_id, workflow_id, from_status, to_status)
    WHERE deleted_at IS NULL;

-- 5. Index on workflow history audit timelines
CREATE INDEX IF NOT EXISTS idx_workflow_history_timeline
    ON workflow_history (tenant_id, request_id, created_at DESC);

-- 6. Index on workflow comments timestamps
CREATE INDEX IF NOT EXISTS idx_workflow_comments_timeline
    ON workflow_comments (tenant_id, request_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- 7. Index on workflow notifications processing outbox queue
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_worker
    ON workflow_notifications (tenant_id, status, retry_count, next_retry_at)
    WHERE deleted_at IS NULL;

-- 8. Index on temporal delegations checks
CREATE INDEX IF NOT EXISTS idx_workflow_delegations_range
    ON workflow_delegations (tenant_id, original_user_id, is_active)
    WHERE deleted_at IS NULL;

-- 9. Index on notification dead letter queue
CREATE INDEX IF NOT EXISTS idx_dlq_notifications_tenant
    ON workflow_notification_dead_letters (tenant_id, dead_at DESC);
