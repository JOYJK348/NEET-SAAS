-- ============================================================================
-- SQL Seed File: 03.09_designations_seed.sql
-- Domain: Designations Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.designations (id, tenant_id, code, name, is_active, is_system)
VALUES 
    -- ABC NEET Designations
    ('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'PRIN', 'Principal', true, true),
    ('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'HOD', 'Head of Department', true, true),
    ('e0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'TUTOR', 'Tutor', true, false),
    ('e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'RECP', 'Receptionist', true, false),
    ('e0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'ACCT', 'Accountant', true, false),

    -- XYZ Medical Designations
    ('e0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'PRIN', 'Principal', true, true),
    ('e0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'HOD', 'Head of Department', true, true),
    ('e0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'TUTOR', 'Tutor', true, false),
    ('e0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002', 'RECP', 'Receptionist', true, false),
    ('e0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000002', 'ACCT', 'Accountant', true, false)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    version = designations.version + 1
WHERE designations.name IS DISTINCT FROM EXCLUDED.name 
   OR designations.is_active IS DISTINCT FROM EXCLUDED.is_active;
