-- ============================================================================
-- File       : 008_role_templates.sql
-- Module     : Authorization
-- Purpose    : Seed data mapping baseline template scopes to bootstrap new tenants.
-- Depends On : permissions, institutes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_perm RECORD;
BEGIN
    -- Resolve active tenant
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 1. Seed FACULTY template: receives Academics, Admissions, and Exam permissions
    FOR v_perm IN 
        SELECT id FROM permissions 
        WHERE tenant_id = v_tenant_id 
          AND (permission_key LIKE 'academics.%' OR permission_key LIKE 'admissions.%' OR permission_key LIKE 'exams.%')
    LOOP
        INSERT INTO role_templates (tenant_id, role_code, permission_id)
        VALUES (v_tenant_id, 'FACULTY', v_perm.id)
        ON CONFLICT (tenant_id, role_code, permission_id) DO NOTHING;
    END LOOP;

    -- 2. Seed STUDENT template: receives View permissions for Academics and Exams
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
        INSERT INTO role_templates (tenant_id, role_code, permission_id)
        VALUES (v_tenant_id, 'STUDENT', v_perm.id)
        ON CONFLICT (tenant_id, role_code, permission_id) DO NOTHING;
    END LOOP;
END $$;
