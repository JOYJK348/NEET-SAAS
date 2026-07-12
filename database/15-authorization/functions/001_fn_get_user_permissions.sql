-- ============================================================================
-- File       : 001_fn_get_user_permissions.sql
-- Module     : Authorization
-- Purpose    : Resolves all active permissions (including inherited and dependencies) for a user.
-- Depends On : user_roles, roles, role_inheritance, role_permissions, permissions, permission_dependencies
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_user_permissions(
    p_tenant_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    permission_id UUID,
    permission_key VARCHAR,
    resource VARCHAR,
    action VARCHAR,
    scope VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE 
    -- 1. Resolve all directly assigned active roles
    active_assigned_roles AS (
        SELECT ur.role_id
        FROM user_roles ur
        WHERE ur.tenant_id = p_tenant_id
          AND ur.user_id = p_user_id
          AND ur.deleted_at IS NULL
          AND NOW() BETWEEN ur.effective_from AND COALESCE(ur.effective_to, '9999-12-31 23:59:59+00'::TIMESTAMPTZ)
    ),
    -- 2. Traverse role inheritance hierarchy recursively
    role_hierarchy AS (
        SELECT role_id AS resolved_role_id
        FROM active_assigned_roles
        
        UNION
        
        SELECT ri.inherits_role_id
        FROM role_inheritance ri
        JOIN role_hierarchy rh ON rh.resolved_role_id = ri.role_id
        WHERE ri.tenant_id = p_tenant_id
          AND ri.deleted_at IS NULL
    ),
    -- 3. Resolve permissions directly mapped to any role in the hierarchy
    direct_permissions AS (
        SELECT rp.permission_id
        FROM role_permissions rp
        JOIN role_hierarchy rh ON rh.resolved_role_id = rp.role_id
        WHERE rp.tenant_id = p_tenant_id
          AND rp.deleted_at IS NULL
    ),
    -- 4. Traverse permission dependencies recursively (e.g. edit depends on view)
    permission_hierarchy AS (
        SELECT dp.permission_id AS resolved_permission_id
        FROM direct_permissions dp
        
        UNION
        
        SELECT pd.requires_permission_id
        FROM permission_dependencies pd
        JOIN permission_hierarchy ph ON ph.resolved_permission_id = pd.permission_id
        WHERE pd.tenant_id = p_tenant_id
          AND pd.deleted_at IS NULL
    )
    -- 5. Select distinct resolved permissions that are active (not deprecated/deleted)
    SELECT DISTINCT 
        p.id,
        p.permission_key,
        p.resource,
        p.action,
        p.scope
    FROM permissions p
    JOIN permission_hierarchy ph ON ph.resolved_permission_id = p.id
    WHERE p.tenant_id = p_tenant_id
      AND p.deleted_at IS NULL
      AND p.is_deprecated = FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION fn_get_user_permissions(UUID, UUID) IS 'Resolves user roles, recursively traverses inheritance hierarchies, extracts assigned permissions, and appends permission prerequisites.';
