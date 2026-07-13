-- ============================================================================
-- File       : 004_audit_logs.sql
-- Module     : Governance
-- Purpose    : Central append-only audit log for all platform operations.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    performed_by UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    correlation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB,

    CONSTRAINT chk_audit_logs_action CHECK (action ~ '^[a-z][a-z_.]{1,49}$'),
    CONSTRAINT chk_audit_logs_entity_type CHECK (length(trim(entity_type)) > 0),
    CONSTRAINT chk_audit_logs_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE audit_logs IS 'Append-only central audit trail for compliance and debugging. No UPDATE or DELETE allowed.';
COMMENT ON COLUMN audit_logs.old_value IS 'Snapshot of the record before the change (NULL for INSERT).';
COMMENT ON COLUMN audit_logs.new_value IS 'Snapshot of the record after the change (NULL for DELETE).';
COMMENT ON COLUMN audit_logs.request_id IS 'HTTP request identifier for request tracing.';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Distributed tracing correlation identifier.';
