-- ============================================================================
-- SQL Seed File: 03.10_courses_seed.sql
-- Domain: Courses Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.courses (id, tenant_id, code, name, duration_months, is_active)
VALUES 
    -- ABC NEET Courses
    ('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'NEET_REP', 'NEET Repeaters', 12, true),
    ('f0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'NEET_CRASH', 'NEET Crash Course', 3, true),
    ('f0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'NEET_FOUND', 'NEET Foundation', 24, true),
    ('f0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'JEE', 'JEE Coaching', 24, true),

    -- XYZ Medical Courses
    ('f0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'NEET_REP', 'NEET Repeaters', 12, true),
    ('f0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'NEET_CRASH', 'NEET Crash Course', 3, true)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    duration_months = EXCLUDED.duration_months,
    is_active = EXCLUDED.is_active,
    version = courses.version + 1
WHERE courses.name IS DISTINCT FROM EXCLUDED.name 
   OR courses.duration_months IS DISTINCT FROM EXCLUDED.duration_months
   OR courses.is_active IS DISTINCT FROM EXCLUDED.is_active;
