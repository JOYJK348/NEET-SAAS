-- ============================================================================
-- SQL Seed File: 03.08_departments_seed.sql
-- Domain: Departments Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.departments (id, tenant_id, code, name, is_active, is_system)
VALUES 
    -- ABC NEET Departments
    ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Administration', true, true),
    ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'ACAD', 'Academic', true, true),
    ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'FIN', 'Finance', true, true),
    ('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'MKTG', 'Marketing', true, false),

    -- XYZ Medical Departments
    ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'ADMIN', 'Administration', true, true),
    ('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'ACAD', 'Academic', true, true),
    ('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'FIN', 'Finance', true, true),
    ('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002', 'MKTG', 'Marketing', true, false)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    version = departments.version + 1
WHERE departments.name IS DISTINCT FROM EXCLUDED.name 
   OR departments.is_active IS DISTINCT FROM EXCLUDED.is_active;

-- Seed Branch-Departments associations (all branches get all departments for simplicity)
INSERT INTO public.branch_departments (tenant_id, branch_id, department_id, is_active)
SELECT 
    b.tenant_id,
    b.id AS branch_id,
    d.id AS department_id,
    true
FROM public.branches b
JOIN public.departments d ON d.tenant_id = b.tenant_id
ON CONFLICT (tenant_id, branch_id, department_id) DO NOTHING;
