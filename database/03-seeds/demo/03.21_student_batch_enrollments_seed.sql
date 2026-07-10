-- ============================================================================
-- SQL Seed File: 03.21_student_batch_enrollments_seed.sql
-- Domain: Student Batch Enrollments Demo Seeding
-- ============================================================================

SET search_path = public;

-- Replaced invalid UUID prefixes ('m', 'l', 'k') with valid hex prefixes
INSERT INTO public.student_batch_enrollments (id, student_admission_id, batch_id, tenant_id, joined_at, status, is_primary)
VALUES 
    ('3c000000-0000-0000-0000-000000000100', '2f000000-0000-0000-0000-000000000100', '2e000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', '2026-06-01', 'ACTIVE', true)
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    status = EXCLUDED.status,
    is_primary = EXCLUDED.is_primary,
    version = student_batch_enrollments.version + 1
WHERE student_batch_enrollments.status IS DISTINCT FROM EXCLUDED.status 
   OR student_batch_enrollments.is_primary IS DISTINCT FROM EXCLUDED.is_primary;
