-- ============================================================================
-- File       : 004_permissions.sql
-- Module     : Authorization
-- Purpose    : Seed data for system permissions catalog.
-- Depends On : permission_groups, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_group_platform_id UUID := '11111111-1111-1111-1111-100000000001';
    v_group_academics_id UUID := '22222222-2222-2222-2222-100000000001';
    v_group_admissions_id UUID := '33333333-3333-3333-3333-100000000001';
    v_group_exams_id UUID := '44444444-4444-4444-4444-100000000001';
    
    v_res VARCHAR;
    v_act VARCHAR;
    v_perm_key VARCHAR;
BEGIN
    -- Resolve active tenant
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 1. Seeding Platform resource mappings with specific allowed actions
    -- Audit logs and permissions metadata only need view/export, no create/edit/delete
    FOR v_res, v_act IN VALUES
        ('menu_groups', 'view'), ('menu_groups', 'create'), ('menu_groups', 'edit'), ('menu_groups', 'delete'),
        ('menu_master', 'view'), ('menu_master', 'create'), ('menu_master', 'edit'), ('menu_master', 'delete'),
        ('permission_groups', 'view'),
        ('permissions', 'view'),
        ('roles', 'view'), ('roles', 'create'), ('roles', 'edit'), ('roles', 'delete'),
        ('role_permissions', 'view'), ('role_permissions', 'edit'),
        ('user_roles', 'view'), ('user_roles', 'create'), ('user_roles', 'edit'), ('user_roles', 'delete'),
        ('role_menu_visibility', 'view'), ('role_menu_visibility', 'edit'),
        ('role_templates', 'view'), ('role_templates', 'edit'),
        ('menu_permissions', 'view'), ('menu_permissions', 'edit'),
        ('permission_dependencies', 'view'),
        ('role_inheritance', 'view'), ('role_inheritance', 'edit'),
        ('permission_conditions', 'view'), ('permission_conditions', 'edit')
    LOOP
        v_perm_key := 'platform.' || v_res || '.' || v_act;
        INSERT INTO permissions (tenant_id, permission_group_id, permission_key, resource, action, description, scope, is_system)
        VALUES (v_tenant_id, v_group_platform_id, v_perm_key, v_res, v_act, 'Allows ' || v_act || ' actions on platform ' || v_res, 'TENANT', true)
        ON CONFLICT (tenant_id, permission_key) DO NOTHING;
    END LOOP;

    -- 2. Seeding Academics resource mappings
    FOR v_res, v_act IN VALUES
        ('years', 'view'), ('years', 'create'), ('years', 'edit'),
        ('subjects', 'view'), ('subjects', 'create'), ('subjects', 'edit'),
        ('batches', 'view'), ('batches', 'create'), ('batches', 'edit'),
        ('timetables', 'view'), ('timetables', 'create'), ('timetables', 'edit')
    LOOP
        v_perm_key := 'academics.' || v_res || '.' || v_act;
        INSERT INTO permissions (tenant_id, permission_group_id, permission_key, resource, action, description, scope, is_system)
        VALUES (v_tenant_id, v_group_academics_id, v_perm_key, v_res, v_act, 'Allows ' || v_act || ' actions on academics ' || v_res, 'TENANT', true)
        ON CONFLICT (tenant_id, permission_key) DO NOTHING;
    END LOOP;

    -- 3. Seeding Admissions resource mappings
    FOR v_res, v_act IN VALUES
        ('student', 'view'), ('student', 'create'), ('student', 'edit'), ('student', 'delete'), ('student', 'export'),
        ('parent', 'view'), ('parent', 'create'), ('parent', 'edit'), ('parent', 'export')
    LOOP
        v_perm_key := 'admissions.' || v_res || '.' || v_act;
        INSERT INTO permissions (tenant_id, permission_group_id, permission_key, resource, action, description, scope, is_system)
        VALUES (v_tenant_id, v_group_admissions_id, v_perm_key, v_res, v_act, 'Allows ' || v_act || ' actions on admissions ' || v_res, 'TENANT', true)
        ON CONFLICT (tenant_id, permission_key) DO NOTHING;
    END LOOP;

    -- 4. Seeding Exams resource mappings
    FOR v_res, v_act IN VALUES
        ('question', 'view'), ('question', 'create'), ('question', 'edit'), ('question', 'delete'), ('question', 'approve'),
        ('mock', 'view'), ('mock', 'create'), ('mock', 'edit'), ('mock', 'delete'), ('mock', 'approve'),
        ('result', 'view'), ('result', 'create'), ('result', 'export')
    LOOP
        v_perm_key := 'exams.' || v_res || '.' || v_act;
        INSERT INTO permissions (tenant_id, permission_group_id, permission_key, resource, action, description, scope, is_system)
        VALUES (v_tenant_id, v_group_exams_id, v_perm_key, v_res, v_act, 'Allows ' || v_act || ' actions on exams ' || v_res, 'TENANT', true)
        ON CONFLICT (tenant_id, permission_key) DO NOTHING;
    END LOOP;
END $$;
