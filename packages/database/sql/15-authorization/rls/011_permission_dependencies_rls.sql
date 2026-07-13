-- ============================================================================
-- File       : 011_permission_dependencies_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for permission_dependencies table.
-- Depends On : permission_dependencies, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE permission_dependencies ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_permission_dependencies_select ON permission_dependencies;
DROP POLICY IF EXISTS policy_permission_dependencies_insert ON permission_dependencies;
DROP POLICY IF EXISTS policy_permission_dependencies_update ON permission_dependencies;
DROP POLICY IF EXISTS policy_permission_dependencies_delete ON permission_dependencies;

-- 3. Select Policy
CREATE POLICY policy_permission_dependencies_select
    ON permission_dependencies
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.permission_dependencies.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_permission_dependencies_insert
    ON permission_dependencies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.permission_dependencies.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_permission_dependencies_update
    ON permission_dependencies
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.permission_dependencies.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.permission_dependencies.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_permission_dependencies_delete
    ON permission_dependencies
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.permission_dependencies.delete', FALSE) = TRUE
    );
