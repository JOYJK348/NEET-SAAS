-- ============================================================================
-- SQL Seed File: 03.13_topics_seed.sql
-- Domain: Topics Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.topics (id, tenant_id, chapter_id, code, name, display_order, is_active)
VALUES 
    -- ABC NEET Topics (Hex prefix: 1d...)
    ('1d000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', '1c000000-0000-0000-0000-000000000011', 'NEWTON_LAWS', 'Newton Laws of Motion', 1, true),
    ('1d000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', '1c000000-0000-0000-0000-000000000012', 'HYDROCARBONS', 'Hydrocarbons & Alkanes', 1, true),
    ('1d000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', '1c000000-0000-0000-0000-000000000013', 'DNA_STRUCTURE', 'DNA Molecular Structure', 1, true),
    ('1d000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', '1c000000-0000-0000-0000-000000000014', 'RESPIRATION', 'Cellular Respiration Process', 1, true),

    -- XYZ Medical Topics
    ('1d000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', '1c000000-0000-0000-0000-000000000021', 'NEWTON_LAWS', 'Newton Laws of Motion', 1, true)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    version = topics.version + 1
WHERE topics.name IS DISTINCT FROM EXCLUDED.name 
   OR topics.is_active IS DISTINCT FROM EXCLUDED.is_active;
