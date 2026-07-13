-- ============================================================================
-- File       : 008_role_menu_visibility_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for role_menu_visibility table.
-- Depends On : role_menu_visibility, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE role_menu_visibility ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_role_menu_visibility_select ON role_menu_visibility;
DROP POLICY IF EXISTS policy_role_menu_visibility_insert ON role_menu_visibility;
DROP POLICY IF EXISTS policy_role_menu_visibility_update ON role_menu_visibility;
DROP POLICY IF EXISTS policy_role_menu_visibility_delete ON role_menu_visibility;

-- 3. Select Policy
CREATE POLICY policy_role_menu_visibility_select
    ON role_menu_visibility
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.role_menu_visibility.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_role_menu_visibility_insert
    ON role_menu_visibility
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.role_menu_visibility.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_role_menu_visibility_update
    ON role_menu_visibility
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.role_menu_visibility.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.role_menu_visibility.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_role_menu_visibility_delete
    ON role_menu_visibility
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.role_menu_visibility.delete', FALSE) = TRUE
    );
