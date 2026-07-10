-- ============================================================================
-- SQL Seed File: 03.25_attendance_seed.sql
-- Domain: Attendance Sessions & Records Demo Seeding
-- ============================================================================

SET search_path = public;

-- Seed attendance session (today, published - using valid hex UUID starting with 3a...)
INSERT INTO public.attendance_sessions (id, tenant_id, branch_id, academic_year_id, batch_id, subject_id, staff_profile_id, attendance_date, starts_at, ends_at, session_status, published_by, published_at)
VALUES 
    ('3a000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', '2e000000-0000-0000-0000-000000000011', '1a000000-0000-0000-0000-000000000011', '3b000000-0000-0000-0000-000000000013', CURRENT_DATE, '09:00:00', '10:00:00', 'PUBLISHED', '3b000000-0000-0000-0000-000000000013', now())
ON CONFLICT (id) DO NOTHING;

-- Seed attendance record for student
INSERT INTO public.attendance_records (id, attendance_session_id, student_admission_id, tenant_id, attendance_status, late_minutes, marked_by, marked_at)
VALUES 
    ('3b000000-0000-0000-0000-000000000301', '3a000000-0000-0000-0000-000000000001', '2f000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000001', 'PRESENT', 0, '3b000000-0000-0000-0000-000000000013', now())
ON CONFLICT (id) DO NOTHING;
