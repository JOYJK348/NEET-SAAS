-- ============================================================================
-- File       : 001_v_user_permissions.sql
-- Module     : Authorization
-- Purpose    : Flat view showing resolved permissions mapping users to capability keys.
-- Depends On : user_roles, fn_get_user_permissions, roles
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

CREATE OR REPLACE VIEW v_user_permissions AS
SELECT DISTINCT
    ur.tenant_id,
    ur.user_id,
    gup.permission_id,
    gup.permission_key,
    gup.resource,
    gup.action,
    gup.scope,
    r.name AS role_name,
    r.priority AS role_priority,
    COALESCE(ur.metadata->>'assignment_source', 'MANUAL') AS assignment_source
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
CROSS JOIN LATERAL fn_get_user_permissions(ur.tenant_id, ur.user_id) gup
WHERE ur.deleted_at IS NULL
  AND NOW() BETWEEN ur.effective_from AND COALESCE(ur.effective_to, '9999-12-31 23:59:59+00'::TIMESTAMPTZ);

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON VIEW v_user_permissions IS 'Flattened runtime reference view listing distinct capability keys active for each user account.';
