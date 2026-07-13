-- ============================================================================
-- File       : 011_workflow_escalations.sql
-- Module     : Workflow
-- Purpose    : SLA escalation event logs database table.
-- Depends On : workflow_requests, workflow_steps
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_escalations CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    
    escalated_from_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    escalated_to_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    
    escalation_level SMALLINT NOT NULL DEFAULT 1,
    target_strategy VARCHAR(50) NOT NULL,
    after_minutes INT NOT NULL,
    
    escalated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    executed_at TIMESTAMPTZ,
    executed_by UUID,
    
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
    CONSTRAINT chk_workflow_escalations_steps CHECK (escalated_from_step_id <> escalated_to_step_id),
    CONSTRAINT chk_workflow_escalations_level CHECK (escalation_level > 0),
    CONSTRAINT chk_workflow_escalations_minutes CHECK (after_minutes >= 0),
    CONSTRAINT chk_workflow_escalations_target_strategy CHECK (target_strategy IN ('NEXT_APPROVER', 'TENANT_ADMIN', 'WORKFLOW_OWNER')),
    CONSTRAINT chk_workflow_escalations_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_escalations_version CHECK (version > 0)
);

-- 3. Comments
COMMENT ON TABLE workflow_escalations IS 'SLA timeout auto-escalation logs mapping requests forwarded to authorities.';
COMMENT ON COLUMN workflow_escalations.escalation_level IS 'The nesting depth count of escalation steps.';
COMMENT ON COLUMN workflow_escalations.target_strategy IS 'Reviewers strategy routing rules for escalations.';
COMMENT ON COLUMN workflow_escalations.after_minutes IS 'Duration thresholds in minutes configured for timeout trigger.';
COMMENT ON COLUMN workflow_escalations.executed_at IS 'Timestamp confirming when the escalation process was actively finalized.';
COMMENT ON COLUMN workflow_escalations.executed_by IS 'Reference user ID confirming the process supervisor or automation daemon account.';
