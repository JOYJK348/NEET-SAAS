-- ============================================================================
-- File       : 006_role_permissions.sql
-- Module     : Authorization
-- Purpose    : Seed data mapping capability permissions to standard roles.
-- Depends On : roles, permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_role_admin_id UUID := '22222222-2222-2222-2222-900000000002';
    v_role_faculty_id UUID := '33333333-3333-3333-3333-900000000003';
    v_role_student_id UUID := '44444444-4444-4444-4444-900000000004';
    
    v_perm RECORD;
BEGIN
    -- Resolve active tenant
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 1. Tenant Admin receives all platform, academics, admissions, and exam permissions
    FOR v_perm IN SELECT id FROM permissions WHERE tenant_id = v_tenant_id LOOP
        INSERT INTO role_permissions (tenant_id, role_id, permission_id)
        VALUES (v_tenant_id, v_role_admin_id, v_perm.id)
        ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 2. Faculty Member receives Academics, Admissions, and Exam permissions
    FOR v_perm IN 
        SELECT id FROM permissions 
        WHERE tenant_id = v_tenant_id 
          AND (permission_key LIKE 'academics.%' OR permission_key LIKE 'admissions.%' OR permission_key LIKE 'exams.%')
    LOOP
        INSERT INTO role_permissions (tenant_id, role_id, permission_id)
        VALUES (v_tenant_id, v_role_faculty_id, v_perm.id)
        ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 3. Student Profile receives View permissions for Academics and Exams, plus create/submit actions on mock results
    FOR v_perm IN 
        SELECT id FROM permissions 
        WHERE tenant_id = v_tenant_id 
          AND (
              permission_key = 'academics.subjects.view' 
              OR permission_key = 'academics.timetables.view'
              OR permission_key = 'exams.mock.view'
              OR permission_key = 'exams.result.view'
              OR permission_key = 'exams.result.create'
          )
    LOOP
        INSERT INTO role_permissions (tenant_id, role_id, permission_id)
        VALUES (v_tenant_id, v_role_student_id, v_perm.id)
        ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;
    END LOOP;
END $$;
