-- ============================================================================
-- File       : 001_governance_functions.sql
-- Module     : Governance
-- Purpose    : Policy resolution, feature evaluation, audit logging, validation.
-- Depends On : policy_settings, feature_flags, audit_logs, system_settings, api_keys
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Get Resolved Policy Value
-- Resolution: Tenant override > Global > Default
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_policy(
    p_tenant_id UUID,
    p_policy_key VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_value JSONB;
BEGIN
    -- 1. Try tenant-specific override
    SELECT value INTO v_value
    FROM policy_settings
    WHERE tenant_id = p_tenant_id
      AND policy_key = p_policy_key
      AND deleted_at IS NULL;

    IF FOUND THEN
        RETURN v_value;
    END IF;

    -- 2. Try global setting (tenant_id IS NULL)
    SELECT value INTO v_value
    FROM policy_settings
    WHERE tenant_id IS NULL
      AND policy_key = p_policy_key
      AND deleted_at IS NULL;

    IF FOUND THEN
        RETURN v_value;
    END IF;

    -- 3. Fall back to default_value
    SELECT default_value INTO v_value
    FROM policy_settings
    WHERE policy_key = p_policy_key
      AND deleted_at IS NULL
    LIMIT 1;

    RETURN v_value;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Check if Feature is Enabled for Tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_is_feature_enabled(
    p_tenant_id UUID,
    p_feature_key VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_enabled BOOLEAN;
    v_global_enabled BOOLEAN;
BEGIN
    -- 1. Check tenant-specific override
    SELECT enabled INTO v_enabled
    FROM feature_flags
    WHERE tenant_id = p_tenant_id
      AND feature_key = p_feature_key
      AND deprecated = false
      AND deleted_at IS NULL;

    IF FOUND THEN
        RETURN v_enabled;
    END IF;

    -- 2. Check global flag
    SELECT enabled INTO v_global_enabled
    FROM feature_flags
    WHERE tenant_id IS NULL
      AND feature_key = p_feature_key
      AND deprecated = false
      AND deleted_at IS NULL;

    RETURN COALESCE(v_global_enabled, false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Get System Setting
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_system_setting(
    p_setting_key VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_value JSONB;
BEGIN
    SELECT value INTO v_value
    FROM system_settings
    WHERE setting_key = p_setting_key;

    RETURN v_value;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Universal Audit Logger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_write_audit(
    p_tenant_id UUID,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_action VARCHAR,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_performed_by UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id UUID DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id BIGINT;
    v_user UUID;
BEGIN
    v_user := COALESCE(p_performed_by, current_user_id(), '00000000-0000-0000-0000-000000000000'::UUID);

    INSERT INTO audit_logs (
        tenant_id, entity_type, entity_id, action, old_value, new_value,
        performed_by, ip_address, user_agent, request_id, correlation_id, metadata
    ) VALUES (
        p_tenant_id, p_entity_type, p_entity_id, p_action, p_old_value, p_new_value,
        v_user, p_ip_address, p_user_agent, p_request_id, p_correlation_id, p_metadata
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Validate Policy Value Against Rule
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_policy(
    p_value JSONB,
    p_value_type VARCHAR,
    p_validation_rule JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_str TEXT;
    v_num NUMERIC;
    v_min NUMERIC;
    v_max NUMERIC;
    v_regex TEXT;
    v_enum JSONB;
BEGIN
    IF p_validation_rule IS NULL THEN
        RETURN true;
    END IF;

    -- Type-specific validation
    CASE p_value_type
        WHEN 'STRING' THEN
            v_str := p_value#>>'{}';
            v_min := (p_validation_rule->>'min_length')::NUMERIC;
            v_max := (p_validation_rule->>'max_length')::NUMERIC;
            v_regex := p_validation_rule->>'pattern';

            IF v_min IS NOT NULL AND length(v_str) < v_min THEN RETURN false; END IF;
            IF v_max IS NOT NULL AND length(v_str) > v_max THEN RETURN false; END IF;
            IF v_regex IS NOT NULL AND v_str !~ v_regex THEN RETURN false; END IF;

        WHEN 'INTEGER' THEN
            v_num := (p_value#>>'{}')::NUMERIC;
            v_min := (p_validation_rule->>'min')::NUMERIC;
            v_max := (p_validation_rule->>'max')::NUMERIC;

            IF v_num <> floor(v_num) THEN RETURN false; END IF;
            IF v_min IS NOT NULL AND v_num < v_min THEN RETURN false; END IF;
            IF v_max IS NOT NULL AND v_num > v_max THEN RETURN false; END IF;

        WHEN 'FLOAT' THEN
            v_num := (p_value#>>'{}')::NUMERIC;
            v_min := (p_validation_rule->>'min')::NUMERIC;
            v_max := (p_validation_rule->>'max')::NUMERIC;

            IF v_min IS NOT NULL AND v_num < v_min THEN RETURN false; END IF;
            IF v_max IS NOT NULL AND v_num > v_max THEN RETURN false; END IF;

        WHEN 'BOOLEAN' THEN
            IF jsonb_typeof(p_value) <> 'boolean' THEN RETURN false; END IF;

        WHEN 'ENUM' THEN
            v_enum := p_validation_rule->>'values';
            IF v_enum IS NOT NULL AND NOT p_value <@ v_enum THEN RETURN false; END IF;

        WHEN 'EMAIL' THEN
            v_str := p_value#>>'{}';
            IF v_str !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN RETURN false; END IF;

        WHEN 'URL' THEN
            v_str := p_value#>>'{}';
            IF v_str !~ '^https?://' THEN RETURN false; END IF;

        WHEN 'REGEX' THEN
            v_str := p_value#>>'{}';
            BEGIN
                PERFORM v_str::REGEX;
            EXCEPTION WHEN OTHERS THEN
                RETURN false;
            END;

        WHEN 'JSON' THEN
            IF p_validation_rule->>'schema' IS NOT NULL THEN
                -- JSON schema validation placeholder
                -- In production, use postgres-json-schema extension or application-level validation
                NULL;
            END IF;

        ELSE
            RETURN false;
    END CASE;

    RETURN true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Get Decrypted API Key
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_api_key(
    p_tenant_id UUID,
    p_service VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_key TEXT;
BEGIN
    SELECT encrypted_key INTO v_key
    FROM api_keys
    WHERE tenant_id = p_tenant_id
      AND service = p_service
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND deleted_at IS NULL;

    RETURN pgp_sym_decrypt(v_key::BYTEA, current_setting('app.encryption_key'));
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Check if Job Should Execute (Scheduler Helper)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_should_execute_job(
    p_tenant_id UUID,
    p_job_key VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_feature_key VARCHAR;
BEGIN
    v_feature_key := 'job.' || p_job_key;
    RETURN fn_is_feature_enabled(p_tenant_id, v_feature_key);
END;
$$;
