-- ============================================================================
-- File       : 006_fn_rls_can_update.sql
-- Module     : Authorization
-- Purpose    : Centralized RLS helper to evaluate UPDATE/EDIT capability.
-- Depends On : current_tenant_id, current_user_is_super_admin, fn_has_permission
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_rls_can_update(
    p_table_tenant_id UUID,
    p_permission_key VARCHAR,
    p_is_system BOOLEAN
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

    -- 3. System Records Protection (blocks normal users editing system defaults)
    IF p_is_system = TRUE THEN
        RETURN FALSE;
    END IF;

    -- 4. Tenant Isolation & Permission Check
    RETURN (
        p_table_tenant_id = current_tenant_id()
        AND fn_has_permission(current_tenant_id(), auth.uid(), p_permission_key) = TRUE
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION fn_rls_can_update(UUID, VARCHAR, BOOLEAN) IS 'Centralized authorization check for UPDATE queries, evaluating system record protection, service role bypasses, super administrators, and tenant boundaries.';
