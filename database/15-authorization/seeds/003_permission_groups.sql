-- ============================================================================
-- File       : 003_permission_groups.sql
-- Module     : Authorization
-- Purpose    : Seed data for permission visual categories.
-- Depends On : institutes
-- Author     : Agaran Platform
-- Version    : 1.0.1
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

    -- Insert default permission groups
    INSERT INTO permission_groups (id, tenant_id, code, title, display_order, is_visible)
    VALUES
        ('11111111-1111-1111-1111-100000000001', v_tenant_id, 'PLATFORM', 'Platform Management', 1, true),
        ('22222222-2222-2222-2222-100000000001', v_tenant_id, 'ACADEMICS', 'Academic Management', 2, true),
        ('33333333-3333-3333-3333-100000000001', v_tenant_id, 'ADMISSIONS', 'Admissions Control', 3, true),
        ('44444444-4444-4444-4444-100000000001', v_tenant_id, 'EXAMS', 'Examinations Control', 4, true)
    ON CONFLICT (tenant_id, code)
    DO UPDATE SET
        title = EXCLUDED.title,
        display_order = EXCLUDED.display_order;
END $$;
