-- ============================================================================
-- File       : 001_governance_rls.sql
-- Module     : Governance
-- Purpose    : Row-level security policies for all governance tables.
-- Depends On : policy_categories, policy_settings, feature_flags, audit_logs, system_settings, api_keys
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE policy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Policy Categories
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_categories_select ON policy_categories;
CREATE POLICY policy_categories_select ON policy_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS policy_categories_insert ON policy_categories;
CREATE POLICY policy_categories_insert ON policy_categories FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(NULL, 'governance.policy.manage'));

DROP POLICY IF EXISTS policy_categories_update ON policy_categories;
CREATE POLICY policy_categories_update ON policy_categories FOR UPDATE TO authenticated USING (fn_rls_can_update(NULL, 'governance.policy.manage', false)) WITH CHECK (fn_rls_can_update(NULL, 'governance.policy.manage', false));

DROP POLICY IF EXISTS policy_categories_delete ON policy_categories;
CREATE POLICY policy_categories_delete ON policy_categories FOR DELETE TO authenticated USING (false);

-- ----------------------------------------------------------------------------
-- 3. Policy Settings (tenant-scoped)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_settings_select ON policy_settings;
CREATE POLICY policy_settings_select ON policy_settings FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'governance.policy.view'));

DROP POLICY IF EXISTS policy_settings_insert ON policy_settings;
CREATE POLICY policy_settings_insert ON policy_settings FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'governance.policy.manage'));

DROP POLICY IF EXISTS policy_settings_update ON policy_settings;
CREATE POLICY policy_settings_update ON policy_settings FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'governance.policy.manage', COALESCE(is_editable, true))) WITH CHECK (fn_rls_can_update(tenant_id, 'governance.policy.manage', COALESCE(is_editable, true)));

DROP POLICY IF EXISTS policy_settings_delete ON policy_settings;
CREATE POLICY policy_settings_delete ON policy_settings FOR DELETE TO authenticated USING (false);

-- ----------------------------------------------------------------------------
-- 4. Feature Flags (tenant-scoped)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS feature_flags_select ON feature_flags;
CREATE POLICY feature_flags_select ON feature_flags FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'governance.features.view'));

DROP POLICY IF EXISTS feature_flags_insert ON feature_flags;
CREATE POLICY feature_flags_insert ON feature_flags FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'governance.features.manage'));

DROP POLICY IF EXISTS feature_flags_update ON feature_flags;
CREATE POLICY feature_flags_update ON feature_flags FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'governance.features.manage', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'governance.features.manage', false));

DROP POLICY IF EXISTS feature_flags_delete ON feature_flags;
CREATE POLICY feature_flags_delete ON feature_flags FOR DELETE TO authenticated USING (false);

-- ----------------------------------------------------------------------------
-- 5. Audit Logs (read-only for authorized users)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'governance.audit.view'));

-- INSERT allowed only via fn_write_audit (SECURITY DEFINER)
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS audit_logs_update ON audit_logs;
CREATE POLICY audit_logs_update ON audit_logs FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS audit_logs_delete ON audit_logs;
CREATE POLICY audit_logs_delete ON audit_logs FOR DELETE TO authenticated USING (false);

-- ----------------------------------------------------------------------------
-- 6. System Settings (platform-admin only)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS system_settings_select ON system_settings;
CREATE POLICY system_settings_select ON system_settings FOR SELECT TO authenticated USING (fn_rls_can_select(NULL, 'platform.admin') OR is_public = true);

DROP POLICY IF EXISTS system_settings_insert ON system_settings;
CREATE POLICY system_settings_insert ON system_settings FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(NULL, 'platform.admin'));

DROP POLICY IF EXISTS system_settings_update ON system_settings;
CREATE POLICY system_settings_update ON system_settings FOR UPDATE TO authenticated USING (fn_rls_can_update(NULL, 'platform.admin', false)) WITH CHECK (fn_rls_can_update(NULL, 'platform.admin', false));

DROP POLICY IF EXISTS system_settings_delete ON system_settings;
CREATE POLICY system_settings_delete ON system_settings FOR DELETE TO authenticated USING (false);

-- ----------------------------------------------------------------------------
-- 7. API Keys (tenant-scoped, encrypted)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS api_keys_select ON api_keys;
CREATE POLICY api_keys_select ON api_keys FOR SELECT TO authenticated USING (fn_rls_can_select(tenant_id, 'governance.api_keys.view'));

DROP POLICY IF EXISTS api_keys_insert ON api_keys;
CREATE POLICY api_keys_insert ON api_keys FOR INSERT TO authenticated WITH CHECK (fn_rls_can_insert(tenant_id, 'governance.api_keys.manage'));

DROP POLICY IF EXISTS api_keys_update ON api_keys;
CREATE POLICY api_keys_update ON api_keys FOR UPDATE TO authenticated USING (fn_rls_can_update(tenant_id, 'governance.api_keys.manage', false)) WITH CHECK (fn_rls_can_update(tenant_id, 'governance.api_keys.manage', false));

DROP POLICY IF EXISTS api_keys_delete ON api_keys;
CREATE POLICY api_keys_delete ON api_keys FOR DELETE TO authenticated USING (fn_rls_can_update(tenant_id, 'governance.api_keys.manage', false));
