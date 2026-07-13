-- ============================================================================
-- File       : 002_menu_master_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for menu_master table.
-- Depends On : menu_master, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE menu_master ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_menu_master_select ON menu_master;
DROP POLICY IF EXISTS policy_menu_master_insert ON menu_master;
DROP POLICY IF EXISTS policy_menu_master_update ON menu_master;
DROP POLICY IF EXISTS policy_menu_master_delete ON menu_master;

-- 3. Select Policy
CREATE POLICY policy_menu_master_select
    ON menu_master
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.menu_master.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_menu_master_insert
    ON menu_master
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.menu_master.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_menu_master_update
    ON menu_master
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.menu_master.edit', is_system) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.menu_master.edit', is_system) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_menu_master_delete
    ON menu_master
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.menu_master.delete', is_system) = TRUE
    );
