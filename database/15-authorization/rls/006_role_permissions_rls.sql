-- ============================================================================
-- File       : 006_role_permissions_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for role_permissions table.
-- Depends On : role_permissions, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_role_permissions_select ON role_permissions;
DROP POLICY IF EXISTS policy_role_permissions_insert ON role_permissions;
DROP POLICY IF EXISTS policy_role_permissions_update ON role_permissions;
DROP POLICY IF EXISTS policy_role_permissions_delete ON role_permissions;

-- 3. Select Policy
CREATE POLICY policy_role_permissions_select
    ON role_permissions
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.role_permissions.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_role_permissions_insert
    ON role_permissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.role_permissions.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_role_permissions_update
    ON role_permissions
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.role_permissions.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.role_permissions.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_role_permissions_delete
    ON role_permissions
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.role_permissions.delete', FALSE) = TRUE
    );
