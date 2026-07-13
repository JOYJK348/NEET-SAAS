-- ============================================================================
-- SQL Seed File: 03.07_academic_years_seed.sql
-- Domain: Academic Years Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.academic_years (id, tenant_id, code, name, start_date, end_date, is_current, is_active)
VALUES 
    -- ABC NEET Academic Years
    ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'AY2627', 'Academic Year 2026-2027', '2026-06-01', '2027-05-31', true, true),
    ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'AY2728', 'Academic Year 2027-2028', '2027-06-01', '2028-05-31', false, true),
    
    -- XYZ Medical Academic Years
    ('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'AY2627', 'Academic Year 2026-2027', '2026-06-01', '2027-05-31', true, true),
    ('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'AY2728', 'Academic Year 2027-2028', '2027-06-01', '2028-05-31', false, true)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    is_current = EXCLUDED.is_current,
    is_active = EXCLUDED.is_active,
    version = academic_years.version + 1
WHERE academic_years.name IS DISTINCT FROM EXCLUDED.name 
   OR academic_years.is_current IS DISTINCT FROM EXCLUDED.is_current
   OR academic_years.is_active IS DISTINCT FROM EXCLUDED.is_active;
