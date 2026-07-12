-- ============================================================================
-- File       : 004_workflow_steps.sql
-- Module     : Workflow
-- Purpose    : Defines sequential workflow approval steps configurations.
-- Depends On : workflows
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_steps CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    
    step_order SMALLINT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_type VARCHAR(30) NOT NULL DEFAULT 'APPROVAL',
    
    is_optional BOOLEAN NOT NULL DEFAULT false,
    allow_skip BOOLEAN NOT NULL DEFAULT false,
    
    -- Permission-driven assignment mapping
    required_permission VARCHAR(100) NOT NULL,
    assignment_strategy VARCHAR(50) NOT NULL DEFAULT 'PERMISSION',
    assignment_config JSONB,
    
    -- Timeout and SLA Escalation parameters
    timeout_hours INT DEFAULT 0,
    escalation_strategy VARCHAR(50) NOT NULL DEFAULT 'NEXT_APPROVER',
    escalation_step_id UUID, -- Self-reference linked after step rows insertions
    notification_template VARCHAR(100),
    
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
    CONSTRAINT uq_workflow_steps_order UNIQUE (tenant_id, workflow_id, step_order),
    CONSTRAINT chk_workflow_steps_order CHECK (step_order > 0),
    CONSTRAINT chk_workflow_steps_timeout CHECK (timeout_hours >= 0),
    CONSTRAINT chk_workflow_steps_type CHECK (step_type IN ('APPROVAL', 'REVIEW', 'NOTIFICATION')),
    CONSTRAINT chk_workflow_steps_assignment_strategy CHECK (assignment_strategy IN ('USER', 'ROLE', 'PERMISSION', 'MANAGER', 'CREATOR_MANAGER', 'BRANCH_MANAGER', 'DYNAMIC_FUNCTION')),
    CONSTRAINT chk_workflow_steps_escalation_strategy CHECK (escalation_strategy IN ('NEXT_APPROVER', 'TENANT_ADMIN', 'WORKFLOW_OWNER')),
    CONSTRAINT chk_workflow_steps_assignment_config CHECK (assignment_config IS NULL OR jsonb_typeof(assignment_config) = 'object'),
    CONSTRAINT chk_workflow_steps_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_steps_version CHECK (version > 0)
);

-- Self-reference Foreign Key Constraint mapping
ALTER TABLE workflow_steps 
    ADD CONSTRAINT fk_workflow_steps_escalation FOREIGN KEY (escalation_step_id) 
    REFERENCES workflow_steps (id) ON DELETE SET NULL;

-- 2. Indexes
CREATE INDEX idx_workflow_steps_workflow_step 
    ON workflow_steps (tenant_id, workflow_id, step_order) 
    WHERE deleted_at IS NULL;

-- 3. Comments
COMMENT ON TABLE workflow_steps IS 'Configured pipelines steps defining specific required permission scopes and assignments criteria.';
COMMENT ON COLUMN workflow_steps.step_order IS 'Sequential order check execution steps ranking.';
COMMENT ON COLUMN workflow_steps.timeout_hours IS 'SLA threshold in hours before timeout triggers escalation.';
COMMENT ON COLUMN workflow_steps.escalation_strategy IS 'Routing strategy for escalations (NEXT_APPROVER, TENANT_ADMIN, etc.).';
