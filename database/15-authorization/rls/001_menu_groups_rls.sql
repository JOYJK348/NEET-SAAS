-- ============================================================================
-- File       : 001_menu_groups_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for menu_groups table.
-- Depends On : menu_groups, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE menu_groups ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_menu_groups_select ON menu_groups;
DROP POLICY IF EXISTS policy_menu_groups_insert ON menu_groups;
DROP POLICY IF EXISTS policy_menu_groups_update ON menu_groups;
DROP POLICY IF EXISTS policy_menu_groups_delete ON menu_groups;

-- 3. Select Policy
CREATE POLICY policy_menu_groups_select
    ON menu_groups
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.menu_groups.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_menu_groups_insert
    ON menu_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.menu_groups.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_menu_groups_update
    ON menu_groups
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.menu_groups.edit', is_system) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.menu_groups.edit', is_system) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_menu_groups_delete
    ON menu_groups
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.menu_groups.delete', is_system) = TRUE
    );
