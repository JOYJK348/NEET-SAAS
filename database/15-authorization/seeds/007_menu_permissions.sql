-- ============================================================================
-- File       : 007_menu_permissions.sql
-- Module     : Authorization
-- Purpose    : Seed data mapping menu routes to required permissions.
-- Depends On : menu_master, permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    
    -- Target Menu IDs
    v_menu_db_id UUID := '11111111-1111-1111-1111-100000000000';
    v_menu_usr_id UUID := '11111111-1111-1111-1111-200000000000';
    v_menu_rls_id UUID := '11111111-1111-1111-1111-300000000000';
    v_menu_yrs_id UUID := '22222222-2222-2222-2222-100000000000';
    v_menu_sub_id UUID := '22222222-2222-2222-2222-200000000000';
    v_menu_stu_id UUID := '33333333-3333-3333-3333-100000000000';
    v_menu_prt_id UUID := '33333333-3333-3333-3333-200000000000';
    
    -- Prerequisite Permission IDs
    v_perm_db_id UUID;
    v_perm_usr_id UUID;
    v_perm_rls_id UUID;
    v_perm_yrs_id UUID;
    v_perm_sub_id UUID;
    v_perm_stu_id UUID;
    v_perm_prt_id UUID;
BEGIN
    -- Resolve active tenant
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Resolve required permission IDs
    SELECT id INTO v_perm_db_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'platform.menu_groups.view';
    SELECT id INTO v_perm_usr_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'platform.user_roles.view';
    SELECT id INTO v_perm_rls_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'platform.roles.view';
    SELECT id INTO v_perm_yrs_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'academics.years.view';
    SELECT id INTO v_perm_sub_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'academics.subjects.view';
    SELECT id INTO v_perm_stu_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'admissions.student.view';
    SELECT id INTO v_perm_prt_id FROM permissions WHERE tenant_id = v_tenant_id AND permission_key = 'admissions.parent.view';

    -- Insert dynamic page security mapping lookups
    IF v_perm_db_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_db_id, v_perm_db_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
    IF v_perm_usr_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_usr_id, v_perm_usr_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
    IF v_perm_rls_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_rls_id, v_perm_rls_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
    IF v_perm_yrs_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_yrs_id, v_perm_yrs_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
    IF v_perm_sub_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_sub_id, v_perm_sub_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
    IF v_perm_stu_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_stu_id, v_perm_stu_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
    IF v_perm_prt_id IS NOT NULL THEN
        INSERT INTO menu_permissions (tenant_id, menu_id, permission_id) VALUES (v_tenant_id, v_menu_prt_id, v_perm_prt_id) ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
    END IF;
END $$;
