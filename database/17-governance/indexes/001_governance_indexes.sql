-- ============================================================================
-- File       : 001_governance_indexes.sql
-- Module     : Governance
-- Purpose    : Performance indexes for governance queries.
-- Depends On : policy_settings, feature_flags, audit_logs, api_keys
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Policy lookup by key (tenant-specific)
CREATE INDEX IF NOT EXISTS idx_policy_settings_lookup
    ON policy_settings (policy_key, tenant_id)
    WHERE deleted_at IS NULL;

-- 2. Policy lookup by category
CREATE INDEX IF NOT EXISTS idx_policy_settings_category
    ON policy_settings (category_code, tenant_id)
    WHERE deleted_at IS NULL;

-- 3. Feature flag lookup
CREATE INDEX IF NOT EXISTS idx_feature_flags_lookup
    ON feature_flags (feature_key, tenant_id)
    WHERE deleted_at IS NULL;

-- 4. Active non-deprecated feature flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_active
    ON feature_flags (tenant_id, enabled)
    WHERE deprecated = false AND deleted_at IS NULL;

-- 5. Audit log entity timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs (entity_type, entity_id, created_at DESC);

-- 6. Audit log tenant timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant
    ON audit_logs (tenant_id, created_at DESC);

-- 7. Audit log correlation tracing
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation
    ON audit_logs (correlation_id)
    WHERE correlation_id IS NOT NULL;

-- 8. API key service lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_service
    ON api_keys (tenant_id, service)
    WHERE is_active = true AND deleted_at IS NULL;
