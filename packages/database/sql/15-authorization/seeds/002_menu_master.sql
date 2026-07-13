-- ============================================================================
-- File       : 002_menu_master.sql
-- Module     : Authorization
-- Purpose    : Seed data for sidebar menu items registry.
-- Depends On : menu_groups, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Resolve active tenant
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Insert core platform menu pages
    INSERT INTO menu_master (id, tenant_id, menu_group_id, parent_menu_id, menu_code, title, route, icon, display_order, feature_id, module, page_type, is_visible, is_system)
    VALUES
        -- Platform accordion items
        ('11111111-1111-1111-1111-100000000000', v_tenant_id, '11111111-1111-1111-1111-111111111111', NULL, 'MENU-PLT-DB', 'Platform Dashboard', '/platform/dashboard', 'layout-dashboard', 1, 'PLT-DB-001', 'Platform', 'PAGE', true, true),
        ('11111111-1111-1111-1111-200000000000', v_tenant_id, '11111111-1111-1111-1111-111111111111', NULL, 'MENU-PLT-USR', 'User Directory', '/platform/users', 'users-round', 2, 'PLT-USR-001', 'Platform', 'PAGE', true, true),
        ('11111111-1111-1111-1111-300000000000', v_tenant_id, '11111111-1111-1111-1111-111111111111', NULL, 'MENU-PLT-RLS', 'Roles & RBAC', '/platform/roles', 'shield-check', 3, 'PLT-RLS-001', 'Platform', 'PAGE', true, true),

        -- Academics accordion items
        ('22222222-2222-2222-2222-100000000000', v_tenant_id, '22222222-2222-2222-2222-222222222222', NULL, 'MENU-ACD-YRS', 'Academic Years', '/academics/years', 'calendar', 1, 'ACD-YRS-001', 'Academics', 'PAGE', true, true),
        ('22222222-2222-2222-2222-200000000000', v_tenant_id, '22222222-2222-2222-2222-222222222222', NULL, 'MENU-ACD-SUB', 'Subjects Catalog', '/academics/subjects', 'book-open-check', 2, 'ACD-SUB-001', 'Academics', 'PAGE', true, true),

        -- Admissions accordion items
        ('33333333-3333-3333-3333-100000000000', v_tenant_id, '33333333-3333-3333-3333-333333333333', NULL, 'MENU-ADM-STU', 'Students Directory', '/admissions/students', 'graduation-cap', 1, 'ADM-STU-001', 'Admissions', 'PAGE', true, true),
        ('33333333-3333-3333-3333-200000000000', v_tenant_id, '33333333-3333-3333-3333-333333333333', NULL, 'MENU-ADM-PRT', 'Parents Catalog', '/admissions/parents', 'contact', 2, 'ADM-PRT-001', 'Admissions', 'PAGE', true, true)
    ON CONFLICT (tenant_id, menu_code)
    DO UPDATE SET
        title = EXCLUDED.title,
        route = EXCLUDED.route,
        icon = EXCLUDED.icon,
        display_order = EXCLUDED.display_order,
        feature_id = EXCLUDED.feature_id,
        module = EXCLUDED.module,
        page_type = EXCLUDED.page_type;
END $$;
