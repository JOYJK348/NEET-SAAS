-- ============================================================================
-- File       : 005_fn_rls_can_insert.sql
-- Module     : Authorization
-- Purpose    : Centralized RLS helper to evaluate INSERT/WRITE capability.
-- Depends On : current_tenant_id, current_user_is_super_admin, fn_has_permission
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_rls_can_insert(
    p_table_tenant_id UUID,
    p_permission_key VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- 1. Service Role Bypass
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    -- 2. Super Admin Bypass
    IF current_user_is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- 3. Tenant Isolation & Permission Check
    RETURN (
        p_table_tenant_id = current_tenant_id()
        AND fn_has_permission(current_tenant_id(), auth.uid(), p_permission_key) = TRUE
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION fn_rls_can_insert(UUID, VARCHAR) IS 'Centralized authorization check for INSERT queries, evaluating service role bypasses, super administrators, and tenant boundaries.';
