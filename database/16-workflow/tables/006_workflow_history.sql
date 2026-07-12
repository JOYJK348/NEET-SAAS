-- ============================================================================
-- File       : 006_workflow_history.sql
-- Module     : Workflow
-- Purpose    : Append-only audit log table tracking workflow state changes.
-- Depends On : workflow_requests, workflow_steps, workflow_states, workflow_actions
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_history CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    
    from_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    to_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    
    action_code VARCHAR(30) NOT NULL REFERENCES workflow_actions(code) ON UPDATE CASCADE,
    from_status VARCHAR(30) NOT NULL REFERENCES workflow_states(code) ON UPDATE CASCADE,
    to_status VARCHAR(30) NOT NULL REFERENCES workflow_states(code) ON UPDATE CASCADE,
    
    from_assignee_user_id UUID,
    to_assignee_user_id UUID,
    from_assignee_group VARCHAR(100),
    to_assignee_group VARCHAR(100),
    
    performed_by UUID NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB,
    
    -- Inline constraints & validations
    CONSTRAINT chk_workflow_history_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

-- 2. Indexes
CREATE INDEX idx_workflow_history_request 
    ON workflow_history (tenant_id, request_id, created_at DESC);

-- 3. Comments
COMMENT ON TABLE workflow_history IS 'Append-only historical audit trail mapping all transaction updates and state transitions.';
COMMENT ON COLUMN workflow_history.action_code IS 'Required action execution trigger linked to transition path.';
COMMENT ON COLUMN workflow_history.performed_by IS 'Reference pointer to users profile table mapping execution author.';
COMMENT ON COLUMN workflow_history.from_assignee_user_id IS 'Assignee user before transition action.';
COMMENT ON COLUMN workflow_history.to_assignee_user_id IS 'Assignee user after transition action completes.';
