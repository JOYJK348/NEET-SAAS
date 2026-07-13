-- ============================================================================
-- File       : 002_v_menu_access.sql
-- Module     : Authorization
-- Purpose    : View mapping accessible menu route nodes per user.
-- Depends On : user_roles, menu_master, fn_can_access_menu
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

CREATE OR REPLACE VIEW v_menu_access AS
SELECT DISTINCT
    ur.tenant_id,
    ur.user_id,
    mm.id AS menu_id,
    mm.menu_code,
    mm.title,
    mm.route,
    mm.icon,
    mm.page_type,
    mm.workflow_enabled,
    mm.workflow_key,
    mm.feature_flag_key,
    mm.license_key,
    mm.parent_menu_id,
    mm.menu_group_id,
    mm.display_order
FROM user_roles ur
CROSS JOIN menu_master mm
WHERE ur.deleted_at IS NULL
  AND mm.deleted_at IS NULL
  AND NOW() BETWEEN ur.effective_from AND COALESCE(ur.effective_to, '9999-12-31 23:59:59+00'::TIMESTAMPTZ)
  AND fn_can_access_menu(ur.tenant_id, ur.user_id, mm.id) = TRUE;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON VIEW v_menu_access IS 'Resolved navigation map containing routes accessible to users based on active overrides and credentials.';
