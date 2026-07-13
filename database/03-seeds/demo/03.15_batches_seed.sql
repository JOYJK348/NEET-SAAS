-- ============================================================================
-- SQL Seed File: 03.15_batches_seed.sql
-- Domain: Batches Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.batches (id, tenant_id, branch_id, course_id, academic_year_id, delivery_type_id, code, name, start_date, end_date, status, allow_new_admissions, is_active)
VALUES 
    -- ABC NEET - Madurai Branch - Repeaters Course - Morning Batch (Hex prefix: 2e...)
    ('2e000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', '2d000000-0000-0000-0000-000000000011', 'MORN_B1', 'Morning Batch 1', '2026-06-01', '2027-05-31', 'ACTIVE', true, true),
    
    -- ABC NEET - Madurai Branch - Repeaters Course - Evening Batch
    ('2e000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', '2d000000-0000-0000-0000-000000000011', 'EVE_B1', 'Evening Batch 1', '2026-06-01', '2027-05-31', 'ACTIVE', true, true),

    -- XYZ Medical - Madurai Branch - Repeaters Course - Morning Batch
    ('2e000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000021', '2d000000-0000-0000-0000-000000000021', 'MORN_B1', 'Morning Batch 1', '2026-06-01', '2027-05-31', 'ACTIVE', true, true)
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    allow_new_admissions = EXCLUDED.allow_new_admissions,
    is_active = EXCLUDED.is_active,
    version = batches.version + 1
WHERE batches.name IS DISTINCT FROM EXCLUDED.name 
   OR batches.status IS DISTINCT FROM EXCLUDED.status
   OR batches.allow_new_admissions IS DISTINCT FROM EXCLUDED.allow_new_admissions
   OR batches.is_active IS DISTINCT FROM EXCLUDED.is_active;
