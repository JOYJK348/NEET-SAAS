-- ============================================================================
-- SQL Seed File: 03.17_staff_seed.sql
-- Domain: Staff Profiles Demo Seeding
-- ============================================================================

SET search_path = public;

-- Principal Profile (Ramesh Kumar - using valid hex UUID starting with 3b...)
INSERT INTO public.staff_profiles (user_id, tenant_id, employee_code, designation_id, employment_type, employment_status, joined_at)
VALUES 
    ('3b000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'EMP_ABC_001', 'e0000000-0000-0000-0000-000000000011', 'FULL_TIME', 'ACTIVE', '2026-06-01')
ON CONFLICT (user_id) DO NOTHING;

-- Admin Profile (Suresh Rajan)
INSERT INTO public.staff_profiles (user_id, tenant_id, employee_code, designation_id, employment_type, employment_status, joined_at)
VALUES 
    ('3b000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'EMP_ABC_002', 'e0000000-0000-0000-0000-000000000012', 'FULL_TIME', 'ACTIVE', '2026-06-01')
ON CONFLICT (user_id) DO NOTHING;

-- Physics Teacher (Balaji)
INSERT INTO public.staff_profiles (user_id, tenant_id, employee_code, designation_id, employment_type, employment_status, joined_at)
VALUES 
    ('3b000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'EMP_ABC_003', 'e0000000-0000-0000-0000-000000000013', 'FULL_TIME', 'ACTIVE', '2026-06-01')
ON CONFLICT (user_id) DO NOTHING;

-- Chemistry Teacher (Devi)
INSERT INTO public.staff_profiles (user_id, tenant_id, employee_code, designation_id, employment_type, employment_status, joined_at)
VALUES 
    ('3b000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'EMP_ABC_004', 'e0000000-0000-0000-0000-000000000013', 'FULL_TIME', 'ACTIVE', '2026-06-01')
ON CONFLICT (user_id) DO NOTHING;

-- Biology Teacher (Chitra)
INSERT INTO public.staff_profiles (user_id, tenant_id, employee_code, designation_id, employment_type, employment_status, joined_at)
VALUES 
    ('3b000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'EMP_ABC_005', 'e0000000-0000-0000-0000-000000000013', 'FULL_TIME', 'ACTIVE', '2026-06-01')
ON CONFLICT (user_id) DO NOTHING;


-- Seed Staff-Department assignments
INSERT INTO public.staff_departments (staff_profile_id, branch_id, department_id, tenant_id, is_primary, is_active)
VALUES
    -- Ramesh: Admin department
    ('3b000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', true, true),
    -- Suresh: Admin department
    ('3b000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', true, true),
    -- Balaji: Academic department
    ('3b000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', true, true)
ON CONFLICT (staff_profile_id, branch_id, department_id) DO NOTHING;

-- Seed Staff-Subjects assignments (teachers mapped to qualified subjects)
INSERT INTO public.staff_subjects (staff_profile_id, subject_id, tenant_id, is_active)
VALUES
    -- Balaji: Physics
    ('3b000000-0000-0000-0000-000000000013', '1a000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', true),
    -- Devi: Chemistry
    ('3b000000-0000-0000-0000-000000000014', '1a000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', true),
    -- Chitra: Botany & Zoology
    ('3b000000-0000-0000-0000-000000000015', '1a000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', true),
    ('3b000000-0000-0000-0000-000000000015', '1a000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', true)
ON CONFLICT (staff_profile_id, subject_id) DO NOTHING;
