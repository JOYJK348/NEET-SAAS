-- ============================================================================
-- File       : 004_permissions_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for permissions table.
-- Depends On : permissions, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_permissions_select ON permissions;
DROP POLICY IF EXISTS policy_permissions_insert ON permissions;
DROP POLICY IF EXISTS policy_permissions_update ON permissions;
DROP POLICY IF EXISTS policy_permissions_delete ON permissions;

-- 3. Select Policy
CREATE POLICY policy_permissions_select
    ON permissions
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.permissions.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_permissions_insert
    ON permissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.permissions.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_permissions_update
    ON permissions
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.permissions.edit', is_system) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.permissions.edit', is_system) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_permissions_delete
    ON permissions
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.permissions.delete', is_system) = TRUE
    );
