-- ============================================================================
-- File       : 001_governance_procedures.sql
-- Module     : Governance
-- Purpose    : Scheduled maintenance jobs for audit cleanup, key rotation, flags.
-- Depends On : audit_logs, api_keys, feature_flags
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Cleanup Audit Logs (Retention-based archival/deletion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_cleanup_audit_logs(
    p_retention_days INT DEFAULT 365
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cutoff TIMESTAMPTZ;
    v_deleted BIGINT;
BEGIN
    v_cutoff := NOW() - (p_retention_days || ' days')::INTERVAL;

    DELETE FROM audit_logs
    WHERE created_at < v_cutoff;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE 'Audit Cleanup: Deleted % records older than % days', v_deleted, p_retention_days;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Rotate Expired API Keys (Mark inactive)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_rotate_api_keys()
LANGUAGE plpgsql
AS $$
DECLARE
    v_rotated INT;
BEGIN
    UPDATE api_keys
    SET is_active = false,
        last_rotated_at = NOW(),
        updated_at = NOW(),
        version = version + 1
    WHERE expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND is_active = true;

    GET DIAGNOSTICS v_rotated = ROW_COUNT;
    RAISE NOTICE 'Key Rotation: Deactivated % expired API keys', v_rotated;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Disable Deprecated Feature Flags
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_disable_deprecated_flags()
LANGUAGE plpgsql
AS $$
DECLARE
    v_disabled INT;
BEGIN
    UPDATE feature_flags
    SET enabled = false,
        updated_at = NOW(),
        version = version + 1
    WHERE deprecated = true
      AND enabled = true;

    GET DIAGNOSTICS v_disabled = ROW_COUNT;
    RAISE NOTICE 'Flag Cleanup: Disabled % deprecated feature flags', v_disabled;
END;
$$;
