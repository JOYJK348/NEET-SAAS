-- ============================================================================
-- File       : 009_super_admin.sql
-- Module     : Authorization
-- Purpose    : Bootstraps super admin assignments dynamically from users table.
-- Depends On : roles, users, user_roles
-- Author     : Agaran Platform
-- Version    : 1.0.2
-- ============================================================================

DO $$
DECLARE
    v_role_super_id UUID := '11111111-1111-1111-1111-900000000001';
    v_user RECORD;
BEGIN
    -- Dynamically map active users designated as super admins in users table where tenant_id is not null
    FOR v_user IN 
        SELECT id, tenant_id 
        FROM users 
        WHERE is_super_admin = TRUE 
          AND tenant_id IS NOT NULL 
          AND deleted_at IS NULL 
    LOOP
        INSERT INTO user_roles (tenant_id, user_id, role_id, effective_from, effective_to, assigned_by, assignment_reason)
        VALUES (
            v_user.tenant_id, 
            v_user.id, 
            v_role_super_id, 
            NOW(), 
            NULL, 
            v_user.id, 
            'Platform auto-bootstrap mapping for super administrator account'
        )
        ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING;
    END LOOP;
END $$;
