-- ============================================================================
-- File       : 012_role_inheritance_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for role_inheritance table.
-- Depends On : role_inheritance, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE role_inheritance ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_role_inheritance_select ON role_inheritance;
DROP POLICY IF EXISTS policy_role_inheritance_insert ON role_inheritance;
DROP POLICY IF EXISTS policy_role_inheritance_update ON role_inheritance;
DROP POLICY IF EXISTS policy_role_inheritance_delete ON role_inheritance;

-- 3. Select Policy
CREATE POLICY policy_role_inheritance_select
    ON role_inheritance
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.role_inheritance.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_role_inheritance_insert
    ON role_inheritance
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.role_inheritance.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_role_inheritance_update
    ON role_inheritance
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.role_inheritance.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.role_inheritance.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_role_inheritance_delete
    ON role_inheritance
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.role_inheritance.delete', FALSE) = TRUE
    );
