-- ============================================================================
-- File       : 002_workflow_states.sql
-- Module     : Workflow
-- Purpose    : Master workflow states definition table.
-- Depends On : None (core lookup catalog)
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_states CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_states (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_initial BOOLEAN NOT NULL DEFAULT false,
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    color VARCHAR(30),
    icon VARCHAR(50),
    
    -- Audit Stamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Inline constraints & validations
    CONSTRAINT chk_workflow_states_code CHECK (code ~ '^[A-Z_]{1,29}$'),
    CONSTRAINT chk_workflow_states_name CHECK (length(trim(name)) > 0)
);

-- 2. Comments
COMMENT ON TABLE workflow_states IS 'Master lookup catalog defining allowed workflow execution states.';
COMMENT ON COLUMN workflow_states.code IS 'Uppercase string identifier key (e.g. DRAFT, PENDING, APPROVED).';
COMMENT ON COLUMN workflow_states.is_terminal IS 'True if state represents completion checkpoints (e.g. APPROVED, REJECTED).';
