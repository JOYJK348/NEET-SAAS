-- ============================================================================
-- File       : 002_fn_has_permission.sql
-- Module     : Authorization
-- Purpose    : Checks if a user has a specific permission key.
-- Depends On : fn_get_user_permissions, user_roles, roles
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_has_permission(
    p_tenant_id UUID,
    p_user_id UUID,
    p_permission_key VARCHAR
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_role BOOLEAN;
    v_has_permission BOOLEAN;
BEGIN
    -- 1. Short-circuit: Super Admin bypass check (priority check or role code 'SUPER_ADMIN')
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.tenant_id = p_tenant_id
          AND ur.user_id = p_user_id
          AND r.code = 'SUPER_ADMIN'
          AND ur.deleted_at IS NULL
          AND NOW() BETWEEN ur.effective_from AND COALESCE(ur.effective_to, '9999-12-31 23:59:59+00'::TIMESTAMPTZ)
    ) INTO v_has_role;

    IF v_has_role THEN
        RETURN TRUE;
    END IF;

    -- 2. Regular check: Evaluate permissions resolved from the user hierarchy
    SELECT EXISTS (
        SELECT 1 
        FROM fn_get_user_permissions(p_tenant_id, p_user_id) gup
        WHERE gup.permission_key = p_permission_key
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION fn_has_permission(UUID, UUID, VARCHAR) IS 'Checks if user possesses the specified capability key, defaulting to true for super administrators.';
