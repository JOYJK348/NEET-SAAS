-- ============================================================================
-- File       : 003_workflow_actions.sql
-- Module     : Workflow
-- Purpose    : Master workflow actions catalog definition table.
-- Depends On : None (core lookup catalog)
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_actions CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_actions (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    action_category VARCHAR(30) NOT NULL DEFAULT 'USER',
    description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Inline constraints & validations
    CONSTRAINT chk_workflow_actions_code CHECK (code ~ '^[A-Z_]{1,29}$'),
    CONSTRAINT chk_workflow_actions_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_workflow_actions_category CHECK (action_category IN ('SYSTEM', 'USER', 'AUTO'))
);

-- 2. Comments
COMMENT ON TABLE workflow_actions IS 'Master lookup catalog defining allowed reviewer submission action types.';
COMMENT ON COLUMN workflow_actions.code IS 'Uppercase string identifier key (e.g. SUBMIT, APPROVE, REJECT, REQUEST_CHANGES).';
COMMENT ON COLUMN workflow_actions.action_category IS 'Classification of action executor scope (USER submitted, SYSTEM triggered, or AUTO resolved).';
