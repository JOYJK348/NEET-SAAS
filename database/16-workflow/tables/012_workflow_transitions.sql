-- ============================================================================
-- File       : 012_workflow_transitions.sql
-- Module     : Workflow
-- Purpose    : Defines permitted state transitions rules catalog.
-- Depends On : workflows, workflow_states, workflow_actions
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_transitions CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    
    from_status VARCHAR(30) NOT NULL REFERENCES workflow_states(code) ON UPDATE CASCADE,
    to_status VARCHAR(30) NOT NULL REFERENCES workflow_states(code) ON UPDATE CASCADE,
    action_code VARCHAR(30) NOT NULL REFERENCES workflow_actions(code) ON UPDATE CASCADE,
    
    requires_comment BOOLEAN NOT NULL DEFAULT false,
    condition_expression TEXT,
    event_name VARCHAR(100),
    transition_name VARCHAR(100) NOT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    version INT NOT NULL DEFAULT 1,
    metadata JSONB,
    
    -- Inline constraints & validations
    CONSTRAINT uq_workflow_transitions UNIQUE (tenant_id, workflow_id, from_status, action_code, to_status),
    CONSTRAINT chk_workflow_transitions_diff CHECK (from_status <> to_status),
    CONSTRAINT chk_workflow_transitions_name CHECK (length(trim(transition_name)) > 0),
    CONSTRAINT chk_workflow_transitions_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_transitions_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX idx_workflow_transitions_lookup 
    ON workflow_transitions (tenant_id, workflow_id) 
    WHERE deleted_at IS NULL;

-- 3. Comments
COMMENT ON TABLE workflow_transitions IS 'Allowed state machine transition configuration paths mapper catalog.';
COMMENT ON COLUMN workflow_transitions.from_status IS 'Starting status checkpoint of request.';
COMMENT ON COLUMN workflow_transitions.to_status IS 'Destination target status checkpoint allowed by transaction.';
COMMENT ON COLUMN workflow_transitions.action_code IS 'Required action execution trigger linked to transition path.';
COMMENT ON COLUMN workflow_transitions.requires_comment IS 'True if reviewer must submit an explanation text comment.';
COMMENT ON COLUMN workflow_transitions.condition_expression IS 'Optional PostgreSQL boolean expression evaluated against entity_snapshot to guard transition (e.g. entity_snapshot->>''amount'')::numeric > 50000';
COMMENT ON COLUMN workflow_transitions.event_name IS 'Optional event hook identifier fired on transition (e.g. workflow.completed, workflow.rejected) for external integration.';
