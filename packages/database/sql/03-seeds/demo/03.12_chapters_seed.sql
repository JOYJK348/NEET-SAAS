-- ============================================================================
-- SQL Seed File: 03.12_chapters_seed.sql
-- Domain: Chapters Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.chapters (id, tenant_id, course_subject_id, code, name, display_order, is_active)
VALUES 
    -- ABC NEET Physics Chapters (Hex prefix: 1c...)
    ('1c000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', '1b000000-0000-0000-0000-000000000011', 'MECH', 'Mechanics', 1, true),
    
    -- ABC NEET Chemistry Chapters
    ('1c000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', '1b000000-0000-0000-0000-000000000012', 'ORG_CHEM', 'Organic Chemistry', 1, true),

    -- ABC NEET Botany Chapters
    ('1c000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', '1b000000-0000-0000-0000-000000000013', 'CELL_BIO', 'Cell Biology', 1, true),

    -- ABC NEET Zoology Chapters
    ('1c000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', '1b000000-0000-0000-0000-000000000014', 'GENETICS', 'Genetics', 1, true),

    -- XYZ Medical Chapters (Physics)
    ('1c000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', '1b000000-0000-0000-0000-000000000021', 'MECH', 'Mechanics', 1, true)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    version = chapters.version + 1
WHERE chapters.name IS DISTINCT FROM EXCLUDED.name 
   OR chapters.is_active IS DISTINCT FROM EXCLUDED.is_active;
