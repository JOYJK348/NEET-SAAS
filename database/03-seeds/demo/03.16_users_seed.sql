-- ============================================================================
-- SQL Seed File: 03.16_users_seed.sql
-- Domain: Users Authentication Credentials Demo Seeding
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Inserts mock users matching our user types (STAFF, STUDENT, PARENT, SYSTEM).
-- 2. Mock records maps to auth.users framework. Inserts into auth.users first, then public.users.
-- ============================================================================

SET search_path = public;

-- Helper to seed mock auth users if not present (to satisfy auth.users FK constraints)
-- Replaced invalid 'u' UUID prefix with valid hex '3b' prefix
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    -- Super Admin
    ('3b000000-0000-0000-0000-000000000001', 'superadmin@neetplatform.com', '{"first_name": "Platform", "last_name": "SuperAdmin"}'),
    
    -- ABC Tenant Principal, Admins & Teachers
    ('3b000000-0000-0000-0000-000000000011', 'principal.abc@neetplatform.com', '{"first_name": "Ramesh", "last_name": "Kumar"}'),
    ('3b000000-0000-0000-0000-000000000012', 'admin.abc@neetplatform.com', '{"first_name": "Suresh", "last_name": "Rajan"}'),
    ('3b000000-0000-0000-0000-000000000013', 'teacher.physics@abc.com', '{"first_name": "Balaji", "last_name": "S"}'),
    ('3b000000-0000-0000-0000-000000000014', 'teacher.chemistry@abc.com', '{"first_name": "Devi", "last_name": "M"}'),
    ('3b000000-0000-0000-0000-000000000015', 'teacher.biology@abc.com', '{"first_name": "Chitra", "last_name": "N"}'),

    -- ABC Demo Student and Parent
    ('3b000000-0000-0000-0000-000000000100', 'student.demo@abc.com', '{"first_name": "Karthik", "last_name": "R"}'),
    ('3b000000-0000-0000-0000-000000000200', 'parent.demo@abc.com', '{"first_name": "Ramanathan", "last_name": "K"}')
ON CONFLICT (id) DO NOTHING;

-- Seed public.users
INSERT INTO public.users (id, tenant_id, branch_id, email, first_name, last_name, user_type, status, is_super_admin)
VALUES 
    -- Super Admin (No tenant, no branch)
    ('3b000000-0000-0000-0000-000000000001', NULL, NULL, 'superadmin@neetplatform.com', 'Platform', 'SuperAdmin', 'SYSTEM', 'ACTIVE', true),
    
    -- ABC Tenant Staff
    ('3b000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'principal.abc@neetplatform.com', 'Ramesh', 'Kumar', 'STAFF', 'ACTIVE', false),
    ('3b000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'admin.abc@neetplatform.com', 'Suresh', 'Rajan', 'STAFF', 'ACTIVE', false),
    ('3b000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'teacher.physics@abc.com', 'Balaji', 'S', 'STAFF', 'ACTIVE', false),
    ('3b000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'teacher.chemistry@abc.com', 'Devi', 'M', 'STAFF', 'ACTIVE', false),
    ('3b000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'teacher.biology@abc.com', 'Chitra', 'N', 'STAFF', 'ACTIVE', false),

    -- Student
    ('3b000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'student.demo@abc.com', 'Karthik', 'R', 'STUDENT', 'ACTIVE', false),
    
    -- Parent
    ('3b000000-0000-0000-0000-000000000200', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'parent.demo@abc.com', 'Ramanathan', 'K', 'PARENT', 'ACTIVE', false)
ON CONFLICT (id) DO UPDATE 
SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    version = users.version + 1
WHERE users.first_name IS DISTINCT FROM EXCLUDED.first_name 
   OR users.last_name IS DISTINCT FROM EXCLUDED.last_name
   OR users.status IS DISTINCT FROM EXCLUDED.status;

-- Map User Roles bridge table mapping (Super Admin to Super Admin role)
INSERT INTO public.user_roles (user_id, role_id, is_active, assigned_source)
SELECT 
    '3b000000-0000-0000-0000-000000000001',
    id,
    true,
    'SYSTEM'
FROM public.roles
WHERE code = 'SYS_SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;
