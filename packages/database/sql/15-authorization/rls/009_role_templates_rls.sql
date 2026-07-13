-- ============================================================================
-- File       : 009_role_templates_rls.sql
-- Module     : Authorization
-- Purpose    : Row-Level Security policies for role_templates table.
-- Depends On : role_templates, fn_rls_can_select, fn_rls_can_insert, fn_rls_can_update, fn_rls_can_delete
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS policy_role_templates_select ON role_templates;
DROP POLICY IF EXISTS policy_role_templates_insert ON role_templates;
DROP POLICY IF EXISTS policy_role_templates_update ON role_templates;
DROP POLICY IF EXISTS policy_role_templates_delete ON role_templates;

-- 3. Select Policy
CREATE POLICY policy_role_templates_select
    ON role_templates
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_select(tenant_id, 'platform.role_templates.view') = TRUE
    );

-- 4. Insert Policy
CREATE POLICY policy_role_templates_insert
    ON role_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fn_rls_can_insert(tenant_id, 'platform.role_templates.create') = TRUE
    );

-- 5. Update Policy
CREATE POLICY policy_role_templates_update
    ON role_templates
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND fn_rls_can_update(tenant_id, 'platform.role_templates.edit', FALSE) = TRUE
    )
    WITH CHECK (
        fn_rls_can_update(tenant_id, 'platform.role_templates.edit', FALSE) = TRUE
    );

-- 6. Delete Policy
CREATE POLICY policy_role_templates_delete
    ON role_templates
    FOR DELETE
    TO authenticated
    USING (
        fn_rls_can_delete(tenant_id, 'platform.role_templates.delete', FALSE) = TRUE
    );
