-- ============================================================================
-- File       : 005_roles_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for roles table.
-- Depends On : roles, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_roles_select ON roles;
DROP POLICY IF EXISTS policy_roles_insert ON roles;
DROP POLICY IF EXISTS policy_roles_update ON roles;
DROP POLICY IF EXISTS policy_roles_delete ON roles;

-- 3. Select Policy
CREATE POLICY policy_roles_select
    ON roles
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.roles.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_roles_insert
    ON roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.roles.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_roles_update
    ON roles
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.roles.edit', (role_type = 'SYSTEM')) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.roles.edit', (role_type = 'SYSTEM')) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_roles_delete
    ON roles
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.roles.delete', (role_type = 'SYSTEM')) = TRUE
    );
