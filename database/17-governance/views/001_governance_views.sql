-- ============================================================================
-- File       : 001_governance_views.sql
-- Module     : Governance
-- Purpose    : Unified views for active features, policy resolution, audit, health.
-- Depends On : policy_settings, feature_flags, audit_logs, system_settings
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Active Features (resolved per tenant)
CREATE OR REPLACE VIEW v_active_features AS
SELECT
    COALESCE(ff_tenant.tenant_id, ff_global.tenant_id) AS tenant_id,
    COALESCE(ff_tenant.feature_key, ff_global.feature_key) AS feature_key,
    COALESCE(ff_tenant.enabled, ff_global.enabled) AS enabled,
    COALESCE(ff_tenant.rollout_percentage, ff_global.rollout_percentage) AS rollout_percentage,
    COALESCE(ff_tenant.plan_required, ff_global.plan_required) AS plan_required,
    COALESCE(ff_tenant.beta, ff_global.beta) AS beta,
    COALESCE(ff_tenant.internal, ff_global.internal) AS internal,
    COALESCE(ff_tenant.deprecated, ff_global.deprecated) AS deprecated,
    ff_tenant.id AS tenant_override_id,
    CASE WHEN ff_tenant.id IS NOT NULL THEN true ELSE false END AS is_overridden
FROM (SELECT * FROM feature_flags WHERE tenant_id IS NULL AND deleted_at IS NULL) ff_global
FULL JOIN (SELECT * FROM feature_flags WHERE tenant_id IS NOT NULL AND deleted_at IS NULL) ff_tenant
    ON ff_tenant.feature_key = ff_global.feature_key
WHERE COALESCE(ff_tenant.deprecated, ff_global.deprecated) = false;

-- 2. Policy Resolver (shows effective value per tenant)
CREATE OR REPLACE VIEW v_policy_resolver AS
SELECT
    p.tenant_id,
    p.policy_key,
    p.value AS effective_value,
    p.value_type,
    p.default_value,
    p.validation_rule,
    p.is_system,
    p.is_editable,
    p.description,
    c.name AS category_name,
    CASE
        WHEN p.tenant_id IS NOT NULL THEN 'tenant_override'
        ELSE 'global'
    END AS resolution_source
FROM policy_settings p
LEFT JOIN policy_categories c ON c.code = p.category_code
WHERE p.deleted_at IS NULL;

-- 3. Recent Audit Activity
CREATE OR REPLACE VIEW v_recent_audit AS
SELECT
    id,
    tenant_id,
    entity_type,
    entity_id,
    action,
    old_value,
    new_value,
    performed_by,
    ip_address,
    request_id,
    correlation_id,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 1000;

-- 4. System Health Overview
CREATE OR REPLACE VIEW v_system_health AS
SELECT
    (SELECT value#>>'{}' FROM system_settings WHERE setting_key = 'platform.maintenance_mode') AS maintenance_mode,
    (SELECT value#>>'{}' FROM system_settings WHERE setting_key = 'platform.timezone') AS timezone,
    (SELECT value#>>'{}' FROM system_settings WHERE setting_key = 'platform.brand_name') AS brand_name,
    (SELECT value#>>'{}' FROM system_settings WHERE setting_key = 'platform.support_email') AS support_email,
    (SELECT count(1) FROM api_keys WHERE is_active = true) AS active_api_keys,
    (SELECT count(1) FROM api_keys WHERE is_active = true AND expires_at IS NOT NULL AND expires_at <= NOW() + interval '30 days') AS expiring_api_keys,
    (SELECT count(1) FROM feature_flags WHERE deprecated = true AND enabled = true) AS deprecated_flags_active,
    (SELECT count(1) FROM audit_logs WHERE created_at >= NOW() - interval '24 hours') AS audit_24h_volume;

COMMENT ON VIEW v_active_features IS 'Resolved feature flags with tenant override visibility.';
COMMENT ON VIEW v_policy_resolver IS 'Effective policy values with resolution source (tenant vs global).';
COMMENT ON VIEW v_recent_audit IS 'Latest 1000 audit log entries for monitoring.';
COMMENT ON VIEW v_system_health IS 'Platform health overview dashboard (maintenance, keys, flags, audit volume).';
