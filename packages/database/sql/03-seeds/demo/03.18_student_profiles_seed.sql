-- ============================================================================
-- SQL Seed File: 03.18_student_profiles_seed.sql
-- Domain: Student Profiles Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.student_profiles (user_id, tenant_id, student_code, admitted_at, date_of_birth, gender, blood_group, academic_status)
VALUES 
    -- Kartik R (using valid hex UUID starting with 3b...)
    ('3b000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000001', 'STU2026001', '2026-06-01', '2008-05-15', 'MALE', 'O_POS', 'ACTIVE')
ON CONFLICT (user_id) DO UPDATE 
SET 
    student_code = EXCLUDED.student_code,
    academic_status = EXCLUDED.academic_status,
    version = student_profiles.version + 1
WHERE student_profiles.student_code IS DISTINCT FROM EXCLUDED.student_code 
   OR student_profiles.academic_status IS DISTINCT FROM EXCLUDED.academic_status;
