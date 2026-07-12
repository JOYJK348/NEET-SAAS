-- ============================================================================
-- File       : 010_workflow_delegations.sql
-- Module     : Workflow
-- Purpose    : Workflow delegation configurations definition table.
-- Depends On : institutes (via tenant_id validation)
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_delegations CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    original_user_id UUID NOT NULL,
    delegate_user_id UUID NOT NULL,
    
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_to TIMESTAMPTZ,
    delegation_type VARCHAR(30) NOT NULL DEFAULT 'TEMPORARY',
    reason VARCHAR(255),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
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
    CONSTRAINT chk_workflow_delegations_users CHECK (original_user_id <> delegate_user_id),
    CONSTRAINT chk_workflow_delegations_dates CHECK (effective_to IS NULL OR effective_from <= effective_to),
    CONSTRAINT chk_workflow_delegations_type CHECK (delegation_type IN ('TEMPORARY', 'VACATION', 'MEDICAL', 'PERMANENT')),
    CONSTRAINT chk_workflow_delegations_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_delegations_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX idx_workflow_delegations_lookup 
    ON workflow_delegations (tenant_id, original_user_id, is_active) 
    WHERE deleted_at IS NULL;

-- 3. Comments
COMMENT ON TABLE workflow_delegations IS 'Reviewers delegation configuration settings mapping approvals to delegates during leaves.';
COMMENT ON COLUMN workflow_delegations.original_user_id IS 'Standard reviewer user profile UUID.';
COMMENT ON COLUMN workflow_delegations.delegate_user_id IS 'Delegate reviewer user profile UUID to route approval authority.';
COMMENT ON COLUMN workflow_delegations.delegation_type IS 'Classification scope of the delegation (TEMPORARY, VACATION, MEDICAL, or PERMANENT).';
