-- ============================================================================
-- SQL Seed File: 03.06_branches_seed.sql
-- Domain: Branches (Tenant Locations) Demo Seeding
-- ============================================================================

SET search_path = public;

-- Seed branches under ABC NEET and XYZ Medical
INSERT INTO public.branches (id, tenant_id, code, slug, name, display_name, email, phone, branch_type, status)
VALUES 
    -- ABC NEET Branches
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'ABC_MADURAI', 'abc-madurai', 'ABC Madurai Campus', 'Madurai Campus', 'madurai@abcneet.com', '+919999999911', 'CAMPUS', 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'ABC_CHENNAI', 'abc-chennai', 'ABC Chennai Campus', 'Chennai Campus', 'chennai@abcneet.com', '+919999999912', 'CAMPUS', 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'ABC_COIMBATORE', 'abc-coimbatore', 'ABC Coimbatore Campus', 'Coimbatore Campus', 'coimbatore@abcneet.com', '+919999999913', 'CAMPUS', 'ACTIVE'),
    
    -- XYZ Medical Branches
    ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'XYZ_MADURAI', 'xyz-madurai', 'XYZ Madurai Campus', 'Madurai Campus', 'madurai@xyzmed.com', '+919999999921', 'CAMPUS', 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'XYZ_CHENNAI', 'xyz-chennai', 'XYZ Chennai Campus', 'Chennai Campus', 'chennai@xyzmed.com', '+919999999922', 'CAMPUS', 'ACTIVE')
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    version = branches.version + 1
WHERE branches.name IS DISTINCT FROM EXCLUDED.name 
   OR branches.display_name IS DISTINCT FROM EXCLUDED.display_name
   OR branches.email IS DISTINCT FROM EXCLUDED.email
   OR branches.phone IS DISTINCT FROM EXCLUDED.phone;
