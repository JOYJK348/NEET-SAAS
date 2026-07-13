-- ============================================================================
-- File       : 005_system_roles.sql
-- Module     : Authorization
-- Purpose    : Seed data for system baseline roles.
-- Depends On : institutes
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

    -- Insert dynamic roles configurations
    INSERT INTO roles (id, tenant_id, name, code, role_type, is_default, is_editable, is_deletable, priority)
    VALUES
        ('11111111-1111-1111-1111-900000000001', v_tenant_id, 'Super Administrator', 'SUPER_ADMIN', 'SYSTEM', false, false, false, 100),
        ('22222222-2222-2222-2222-900000000002', v_tenant_id, 'Tenant Administrator', 'TENANT_ADMIN', 'SYSTEM', false, false, false, 90),
        ('33333333-3333-3333-3333-900000000003', v_tenant_id, 'Faculty Member', 'FACULTY', 'CUSTOM', false, true, true, 50),
        ('44444444-4444-4444-4444-900000000004', v_tenant_id, 'Student Profile', 'STUDENT', 'CUSTOM', true, true, true, 10),
        ('55555555-5555-5555-5555-900000000005', v_tenant_id, 'Parent Contact', 'PARENT', 'CUSTOM', false, true, true, 5)
    ON CONFLICT (tenant_id, code)
    DO UPDATE SET
        name = EXCLUDED.name,
        role_type = EXCLUDED.role_type,
        is_default = EXCLUDED.is_default,
        priority = EXCLUDED.priority;
END $$;
