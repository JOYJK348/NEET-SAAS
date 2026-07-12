-- ============================================================================
-- File       : 007_workflow_comments.sql
-- Module     : Workflow
-- Purpose    : Reviewer comments definition table linked to requests steps.
-- Depends On : workflow_requests, workflow_steps
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

-- Idempotency bootstrap
DROP TABLE IF EXISTS workflow_comments CASCADE;

-- 1. Create Table Structure
CREATE TABLE workflow_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    visibility VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
    
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
    CONSTRAINT chk_workflow_comments_text CHECK (length(trim(comment_text)) > 0),
    CONSTRAINT chk_workflow_comments_type CHECK (comment_type IN ('GENERAL', 'REJECTION', 'SYSTEM', 'APPROVAL', 'ESCALATION')),
    CONSTRAINT chk_workflow_comments_visibility CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'SYSTEM')),
    CONSTRAINT chk_workflow_comments_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_workflow_comments_version CHECK (version > 0)
);

-- 3. Comments
COMMENT ON TABLE workflow_comments IS 'Reviewer comments and correction feedback records logs.';
COMMENT ON COLUMN workflow_comments.comment_text IS 'HTML/Markdown supported feedback comment content.';
COMMENT ON COLUMN workflow_comments.comment_type IS 'Category classification of notes (GENERAL, REJECTION feedback, SYSTEM notes, APPROVAL confirmation).';
COMMENT ON COLUMN workflow_comments.visibility IS 'Access scope of the comment (PUBLIC, PRIVATE for internal admins, or SYSTEM).';
