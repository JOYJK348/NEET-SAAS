-- ============================================================================
-- SQL Seed File: 03.20_student_admissions_seed.sql
-- Domain: Student Admissions Demo Seeding
-- ============================================================================

SET search_path = public;

-- Replaced invalid UUID prefixes ('l', 'u', 'c', 'f', 'b') with valid hex prefixes
INSERT INTO public.student_admissions (id, tenant_id, student_profile_id, admission_number, academic_year_id, course_id, branch_id, admission_date, admission_status)
VALUES 
    ('2f000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000100', 'ADM2026001', 'c0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', '2026-06-01', 'ACTIVE')
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    admission_number = EXCLUDED.admission_number,
    admission_status = EXCLUDED.admission_status,
    version = student_admissions.version + 1
WHERE student_admissions.admission_number IS DISTINCT FROM EXCLUDED.admission_number 
   OR student_admissions.admission_status IS DISTINCT FROM EXCLUDED.admission_status;
