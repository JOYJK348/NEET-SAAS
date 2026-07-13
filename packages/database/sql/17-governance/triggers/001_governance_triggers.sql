-- ============================================================================
-- File       : 001_governance_triggers.sql
-- Module     : Governance
-- Purpose    : Automated audit logging, validation, and cache invalidation.
-- Depends On : policy_settings, feature_flags, audit_logs
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Touch Audit Columns Trigger (all governance tables)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_tab RECORD;
BEGIN
    FOR v_tab IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('policy_categories', 'policy_settings', 'feature_flags', 'system_settings', 'api_keys')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_biu_%I_touch_audit ON %I;
            CREATE TRIGGER trg_biu_%I_touch_audit
                BEFORE INSERT OR UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION touch_audit_columns();
        ', v_tab.table_name, v_tab.table_name, v_tab.table_name, v_tab.table_name);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Policy Setting Audit Trail
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_policy_settings_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM fn_write_audit(
            p_tenant_id    => COALESCE(NEW.tenant_id, '00000000-0000-0000-0000-000000000000'::UUID),
            p_entity_type  => 'policy_setting',
            p_entity_id    => NEW.id,
            p_action       => 'policy.updated',
            p_old_value    => row_to_json(OLD)::JSONB,
            p_new_value    => row_to_json(NEW)::JSONB
        );
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM fn_write_audit(
            p_tenant_id    => COALESCE(NEW.tenant_id, '00000000-0000-0000-0000-000000000000'::UUID),
            p_entity_type  => 'policy_setting',
            p_entity_id    => NEW.id,
            p_action       => 'policy.created',
            p_new_value    => row_to_json(NEW)::JSONB
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_policy_settings_audit ON policy_settings;
CREATE TRIGGER trg_after_policy_settings_audit
    AFTER INSERT OR UPDATE ON policy_settings
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_policy_settings_audit();

-- ----------------------------------------------------------------------------
-- 3. Feature Flag Change → NOTIFY for Cache Invalidation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_feature_flag_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.enabled <> NEW.enabled THEN
        PERFORM pg_notify(
            'feature_flag_changed',
            json_build_object(
                'feature_key', NEW.feature_key,
                'tenant_id', NEW.tenant_id,
                'enabled', NEW.enabled,
                'timestamp', NOW()
            )::TEXT
        );

        PERFORM fn_write_audit(
            p_tenant_id    => COALESCE(NEW.tenant_id, '00000000-0000-0000-0000-000000000000'::UUID),
            p_entity_type  => 'feature_flag',
            p_entity_id    => NEW.id,
            p_action       => CASE WHEN NEW.enabled THEN 'feature.enabled' ELSE 'feature.disabled' END,
            p_old_value    => jsonb_build_object('enabled', OLD.enabled),
            p_new_value    => jsonb_build_object('enabled', NEW.enabled)
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_feature_flag_notify ON feature_flags;
CREATE TRIGGER trg_after_feature_flag_notify
    AFTER UPDATE ON feature_flags
    FOR EACH ROW
    WHEN (OLD.enabled IS DISTINCT FROM NEW.enabled)
    EXECUTE FUNCTION fn_trg_feature_flag_notify();

-- ----------------------------------------------------------------------------
-- 4. Audit Logs: Prevent UPDATE/DELETE (Append-only enforcement)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_audit_logs_protect()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are append-only. UPDATE and DELETE are prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_before_audit_logs_protect ON audit_logs;
CREATE TRIGGER trg_before_audit_logs_protect
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_audit_logs_protect();

-- ----------------------------------------------------------------------------
-- 5. API Key Rotation: Update last_used_at on read
-- ----------------------------------------------------------------------------
-- Handled by fn_get_api_key application call; no DB trigger needed.
