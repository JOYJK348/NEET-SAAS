-- ============================================================================
-- File       : 003_fn_can_access_menu.sql
-- Module     : Authorization
-- Purpose    : Determines if a user has access to view/open a specific menu item.
-- Depends On : menu_master, role_menu_visibility, menu_permissions, fn_has_permission, user_roles
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_can_access_menu(
    p_tenant_id UUID,
    p_user_id UUID,
    p_menu_id UUID
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_super_role BOOLEAN;
    v_override_mode VARCHAR;
    v_requires_permission BOOLEAN;
    v_has_menu_permission BOOLEAN;
BEGIN
    -- 1. Short-circuit: Super Admin bypass check
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.tenant_id = p_tenant_id
          AND ur.user_id = p_user_id
          AND r.code = 'SUPER_ADMIN'
          AND ur.deleted_at IS NULL
          AND NOW() BETWEEN ur.effective_from AND COALESCE(ur.effective_to, '9999-12-31 23:59:59+00'::TIMESTAMPTZ)
    ) INTO v_has_super_role;

    IF v_has_super_role THEN
        RETURN TRUE;
    END IF;

    -- 2. Evaluate Role Menu Visibility Overrides
    -- Priority check: DENY has precedence, then ALLOW, then INHERIT (no override)
    SELECT visibility_mode INTO v_override_mode
    FROM role_menu_visibility rm
    JOIN user_roles ur ON ur.role_id = rm.role_id
    WHERE rm.tenant_id = p_tenant_id
      AND ur.user_id = p_user_id
      AND rm.menu_id = p_menu_id
      AND rm.deleted_at IS NULL
      AND ur.deleted_at IS NULL
      AND NOW() BETWEEN ur.effective_from AND COALESCE(ur.effective_to, '9999-12-31 23:59:59+00'::TIMESTAMPTZ)
    ORDER BY CASE visibility_mode
        WHEN 'DENY' THEN 1
        WHEN 'ALLOW' THEN 2
        WHEN 'INHERIT' THEN 3
        ELSE 4
    END ASC
    LIMIT 1;

    IF v_override_mode = 'DENY' THEN
        RETURN FALSE;
    ELSIF v_override_mode = 'ALLOW' THEN
        RETURN TRUE;
    END IF;

    -- 3. If visibility override is INHERIT or missing, evaluate mapped menu permissions
    SELECT EXISTS (
        SELECT 1 FROM menu_permissions 
        WHERE tenant_id = p_tenant_id AND menu_id = p_menu_id AND deleted_at IS NULL
    ) INTO v_requires_permission;

    -- If no permission is mapped to the menu, it is accessible by default
    IF NOT v_requires_permission THEN
        RETURN TRUE;
    END IF;

    -- Check if user possesses at least one permission mapped to the menu page
    SELECT EXISTS (
        SELECT 1 
        FROM menu_permissions mp
        JOIN permissions p ON p.id = mp.permission_id
        WHERE mp.tenant_id = p_tenant_id
          AND mp.menu_id = p_menu_id
          AND mp.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND fn_has_permission(p_tenant_id, p_user_id, p.permission_key) = TRUE
    ) INTO v_has_menu_permission;

    RETURN v_has_menu_permission;
END;
$$;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION fn_can_access_menu(UUID, UUID, UUID) IS 'Checks if a user is permitted to load a sidebar route, evaluating explicit DENY/ALLOW settings first before matching menu-permission links.';
