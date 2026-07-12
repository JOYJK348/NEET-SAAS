-- ============================================================================
-- File       : 005_workflow_requests.sql
-- Module     : Workflow
-- Purpose    : Master live transaction queue table for workflow requests.
-- Depends On : workflows, workflow_steps, workflow_states
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_requests CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
    workflow_version INT NOT NULL DEFAULT 1,
    
    -- Generic entity binding parameters
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    entity_version INT NOT NULL DEFAULT 1,
    entity_snapshot JSONB,
    
    current_step_id UUID REFERENCES workflow_steps(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' REFERENCES workflow_states(code) ON UPDATE CASCADE,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    
    initiator_id UUID NOT NULL,
    current_assignee_user_id UUID,
    current_assignee_group VARCHAR(100),
    
    -- Time limits metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    
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
    CONSTRAINT chk_workflow_requests_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_workflow_requests_entity_type CHECK (length(trim(entity_type)) > 0),
    CONSTRAINT chk_workflow_requests_entity_version CHECK (entity_version > 0),
    CONSTRAINT chk_workflow_requests_entity_snapshot CHECK (entity_snapshot IS NULL OR jsonb_typeof(entity_snapshot) = 'object'),
    CONSTRAINT chk_workflow_requests_version_val CHECK (workflow_version > 0),
    CONSTRAINT chk_workflow_requests_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_requests_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX idx_workflow_requests_entity 
    ON workflow_requests (tenant_id, entity_type, entity_id) 
    WHERE deleted_at IS NULL;

-- 3. Comments
COMMENT ON TABLE workflow_requests IS 'Main live transaction queue mapping dynamic business entities (exams, admissions, fee waivers) to state machine status.';
COMMENT ON COLUMN workflow_requests.entity_type IS 'Target model class/context indicator name (e.g. EXAM_QUESTION, STUDENT_PROFILE).';
COMMENT ON COLUMN workflow_requests.entity_id IS 'Target business record UUID reference ID.';
COMMENT ON COLUMN workflow_requests.entity_version IS 'Snapshot version index tracking entity state during submission.';
COMMENT ON COLUMN workflow_requests.entity_snapshot IS 'Immutable JSON snapshot capturing target record attributes configuration.';
COMMENT ON COLUMN workflow_requests.current_assignee_user_id IS 'Optimized pointer caching active reviewer user ID for fast dashboard lists queries.';
