-- ============================================================================
-- SQL Seed File: 03.22_learning_seed.sql
-- Domain: Learning Materials Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.learning_materials (id, tenant_id, material_code, course_id, subject_id, chapter_id, topic_id, batch_id, title, description, material_type, status, visibility)
VALUES 
    -- ABC NEET - Repeaters Course - Physics Mechanics - Newton Laws Notes
    ('2a000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PHY-MECH-001', 'f0000000-0000-0000-0000-000000000011', '1a000000-0000-0000-0000-000000000011', '1c000000-0000-0000-0000-000000000011', '1d000000-0000-0000-0000-000000000011', '2e000000-0000-0000-0000-000000000011', 'Newton Laws of Motion Lecture Notes', 'Comprehensive reference notes covering Newton First, Second, and Third laws with sample numerical problems.', 'NOTES', 'PUBLISHED', 'BATCH_ONLY')
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    version = learning_materials.version + 1
WHERE learning_materials.title IS DISTINCT FROM EXCLUDED.title 
   OR learning_materials.description IS DISTINCT FROM EXCLUDED.description
   OR learning_materials.status IS DISTINCT FROM EXCLUDED.status;
