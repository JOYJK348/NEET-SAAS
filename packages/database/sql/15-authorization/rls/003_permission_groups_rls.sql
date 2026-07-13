-- ============================================================================
-- File       : 003_permission_groups_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for permission_groups table.
-- Depends On : permission_groups, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE permission_groups ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_permission_groups_select ON permission_groups;
DROP POLICY IF EXISTS policy_permission_groups_insert ON permission_groups;
DROP POLICY IF EXISTS policy_permission_groups_update ON permission_groups;
DROP POLICY IF EXISTS policy_permission_groups_delete ON permission_groups;

-- 3. Select Policy
CREATE POLICY policy_permission_groups_select
    ON permission_groups
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.permission_groups.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_permission_groups_insert
    ON permission_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.permission_groups.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_permission_groups_update
    ON permission_groups
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        -- permission_groups does not have an is_system column; we pass FALSE for the system check parameter
        AND fn_rls_can_update(tenant_id, 'platform.permission_groups.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.permission_groups.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_permission_groups_delete
    ON permission_groups
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.permission_groups.delete', FALSE) = TRUE
    );
