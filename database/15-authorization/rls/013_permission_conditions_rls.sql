-- ============================================================================
-- File       : 013_permission_conditions_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for permission_conditions table.
-- Depends On : permission_conditions, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE permission_conditions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_permission_conditions_select ON permission_conditions;
DROP POLICY IF EXISTS policy_permission_conditions_insert ON permission_conditions;
DROP POLICY IF EXISTS policy_permission_conditions_update ON permission_conditions;
DROP POLICY IF EXISTS policy_permission_conditions_delete ON permission_conditions;

-- 3. Select Policy
CREATE POLICY policy_permission_conditions_select
    ON permission_conditions
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.permission_conditions.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_permission_conditions_insert
    ON permission_conditions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.permission_conditions.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_permission_conditions_update
    ON permission_conditions
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.permission_conditions.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.permission_conditions.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_permission_conditions_delete
    ON permission_conditions
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.permission_conditions.delete', FALSE) = TRUE
    );
