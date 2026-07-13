-- ============================================================================
-- SQL Seed File: 03.05_institutes_seed.sql
-- Domain: Institutes (Tenant) Demo Seeding
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Idempotently seeds demo tenants with dynamic UUID mapping.
-- 2. Uses conditional checks to avoid schema duplicate records.
-- ============================================================================

SET search_path = public;

-- Seed ABC NEET Academy
INSERT INTO public.institutes (id, code, slug, name, display_name, email, phone, status)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'ABC_NEET', 'abc-neet', 'ABC NEET Academy', 'ABC NEET', 'contact@abcneet.com', '+919999999901', 'ACTIVE'),
    ('a0000000-0000-0000-0000-000000000002', 'XYZ_MED', 'xyz-med', 'XYZ Medical Academy', 'XYZ Medical', 'contact@xyzmed.com', '+919999999902', 'ACTIVE')
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    version = institutes.version + 1
WHERE institutes.name IS DISTINCT FROM EXCLUDED.name 
   OR institutes.display_name IS DISTINCT FROM EXCLUDED.display_name
   OR institutes.email IS DISTINCT FROM EXCLUDED.email
   OR institutes.phone IS DISTINCT FROM EXCLUDED.phone;
