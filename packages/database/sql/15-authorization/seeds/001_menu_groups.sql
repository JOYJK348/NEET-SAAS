-- ============================================================================
-- File       : 001_menu_groups.sql
-- Module     : Authorization
-- Purpose    : Seed data for top-level menu groups.
-- Depends On : institutes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Resolve first active tenant or fallback to a standard namespace UUID if none exists
    SELECT id INTO v_tenant_id FROM institutes LIMIT 1;
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Insert default menu groups idempotently
    INSERT INTO menu_groups (id, tenant_id, code, slug, title, icon, color, description, default_expanded, display_order, is_visible, is_system)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_tenant_id, 'PLATFORM', 'platform', 'Platform Management', 'settings', 'text-blue-500', 'System platform settings control panel', false, 1, true, true),
        ('22222222-2222-2222-2222-222222222222', v_tenant_id, 'ACADEMICS', 'academics', 'Academics & Batches', 'book-open', 'text-green-500', 'Subjects, chapters, and timetable plans', true, 2, true, true),
        ('33333333-3333-3333-3333-333333333333', v_tenant_id, 'ADMISSIONS', 'admissions', 'Admissions Control', 'users', 'text-purple-500', 'Student profiles and parents registry', false, 3, true, true),
        ('44444444-4444-4444-4444-444444444444', v_tenant_id, 'EXAMS', 'exams', 'Examinations Portal', 'award', 'text-red-500', 'Question banks and exam result logs', false, 4, true, true)
    ON CONFLICT (tenant_id, code) 
    DO UPDATE SET 
        title = EXCLUDED.title,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        description = EXCLUDED.description,
        display_order = EXCLUDED.display_order;
END $$;
