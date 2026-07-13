-- ============================================================================
-- File       : 007_user_roles_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for user_roles table.
-- Depends On : user_roles, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_user_roles_select ON user_roles;
DROP POLICY IF EXISTS policy_user_roles_insert ON user_roles;
DROP POLICY IF EXISTS policy_user_roles_update ON user_roles;
DROP POLICY IF EXISTS policy_user_roles_delete ON user_roles;

-- 3. Select Policy
CREATE POLICY policy_user_roles_select
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.user_roles.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_user_roles_insert
    ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.user_roles.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_user_roles_update
    ON user_roles
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.user_roles.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.user_roles.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_user_roles_delete
    ON user_roles
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.user_roles.delete', FALSE) = TRUE
    );
