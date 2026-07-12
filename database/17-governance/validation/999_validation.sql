-- ============================================================================
-- File       : 999_validation.sql
-- Module     : Governance
-- Purpose    : Integrity checks for governance schema, seeds, and configuration.
-- Depends On : policy_categories, policy_settings, feature_flags, system_settings
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_missing_categories INT := 0;
    v_duplicate_policies INT := 0;
    v_invalid_feature_keys INT := 0;
    v_missing_system_settings INT := 0;
    v_invalid_enums INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING GOVERNANCE INTEGRITY VALIDATIONS';
    RAISE NOTICE '============================================================';

    -- 1. Check for policy_settings referencing non-existent categories
    SELECT count(1) INTO v_missing_categories
    FROM policy_settings ps
    LEFT JOIN policy_categories pc ON pc.code = ps.category_code
    WHERE pc.code IS NULL AND ps.deleted_at IS NULL;

    IF v_missing_categories > 0 THEN
        RAISE EXCEPTION 'Constraint Conflict: Found % policy_settings referencing invalid category codes.', v_missing_categories;
    END IF;

    -- 2. Check for duplicate active policy keys (same key, same tenant)
    SELECT count(1) INTO v_duplicate_policies
    FROM (
        SELECT policy_key, tenant_id, count(1)
        FROM policy_settings
        WHERE deleted_at IS NULL
        GROUP BY policy_key, tenant_id
        HAVING count(1) > 1
    ) dup;

    IF v_duplicate_policies > 0 THEN
        RAISE EXCEPTION 'Data Integrity: Found % duplicate policy keys for the same tenant scope.', v_duplicate_policies;
    END IF;

    -- 3. Check feature_flags for invalid key patterns
    SELECT count(1) INTO v_invalid_feature_keys
    FROM feature_flags
    WHERE deleted_at IS NULL
      AND feature_key !~ '^[a-z][a-z0-9_.]{1,98}$';

    IF v_invalid_feature_keys > 0 THEN
        RAISE EXCEPTION 'Naming Convention: Found % feature_flags with invalid key format.', v_invalid_feature_keys;
    END IF;

    -- 4. Check required system settings exist
    SELECT count(1) INTO v_missing_system_settings
    FROM (VALUES
        ('platform.maintenance_mode'),
        ('platform.timezone'),
        ('platform.brand_name'),
        ('platform.support_email'),
        ('platform.audit.retention_days')
    ) AS required(key)
    LEFT JOIN system_settings ss ON ss.setting_key = required.key
    WHERE ss.setting_key IS NULL;

    IF v_missing_system_settings > 0 THEN
        RAISE WARNING 'Missing Configuration: % required system settings are not seeded.', v_missing_system_settings;
    END IF;

    -- 5. Check for invalid value_type enums in policy_settings
    SELECT count(1) INTO v_invalid_enums
    FROM policy_settings
    WHERE deleted_at IS NULL
      AND value_type NOT IN ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'EMAIL', 'URL', 'REGEX', 'ENUM');

    IF v_invalid_enums > 0 THEN
        RAISE EXCEPTION 'Constraint Conflict: Found % policy_settings with invalid value_type.', v_invalid_enums;
    END IF;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL GOVERNANCE INTEGRITY TESTS PASSED';
    RAISE NOTICE '============================================================';
END $$;
