-- ============================================================================
-- SQL Seed File: 03.24_exam_seed.sql
-- Domain: Exams, Question Papers, and Attempt Mappings Demo Seeding
-- ============================================================================

SET search_path = public;

-- 1. Seed reusable question paper (valid hex UUID starting with 2c...)
INSERT INTO public.question_papers (id, tenant_id, paper_code, title, course_id, subject_id, total_marks, duration_minutes, status)
VALUES 
    ('2c000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'NEET-MOCK-001', 'NEET Physics & Chemistry Weekly Test Paper', 'f0000000-0000-0000-0000-000000000011', NULL, 8.00, 30, 'PUBLISHED')
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    version = question_papers.version + 1
WHERE question_papers.title IS DISTINCT FROM EXCLUDED.title 
   OR question_papers.status IS DISTINCT FROM EXCLUDED.status;

-- 2. Link questions to the paper (referencing valid 2b... question UUIDs)
INSERT INTO public.question_paper_questions (id, tenant_id, paper_id, question_id, section, marks, negative_marks, display_order)
VALUES 
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2c000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 'Physics', 4.00, 1.00, 1),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2c000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000002', 'Chemistry', 4.00, 1.00, 2)
ON CONFLICT (paper_id, question_id) DO NOTHING;

-- 3. Seed active exam
-- Added published_by and published_at fields to satisfy chk_exams_publish_status when publish_status = 'PUBLISHED'
INSERT INTO public.exams (id, tenant_id, course_id, batch_id, subject_id, academic_year_id, question_paper_id, title, description, exam_type, mode, total_marks, passing_marks, negative_marking_enabled, negative_marking_value, duration_minutes, scheduled_start_at, scheduled_end_at, publish_status, published_by, published_at)
VALUES 
    ('2d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000011', '2e000000-0000-0000-0000-000000000011', NULL, 'c0000000-0000-0000-0000-000000000011', '2c000000-0000-0000-0000-000000000001', 'Weekly Mock Test 1', 'Mock assessment on mechanics and hydrocarbons.', 'WEEKLY', 'ONLINE', 8.00, 4.00, true, 1.00, 30, now() - interval '2 hours', now() + interval '2 hours', 'PUBLISHED', '3b000000-0000-0000-0000-000000000013', now())
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    title = EXCLUDED.title,
    publish_status = EXCLUDED.publish_status,
    published_by = EXCLUDED.published_by,
    published_at = EXCLUDED.published_at,
    version = exams.version + 1
WHERE exams.title IS DISTINCT FROM EXCLUDED.title 
   OR exams.publish_status IS DISTINCT FROM EXCLUDED.publish_status;

-- 4. Register demo student for exam
INSERT INTO public.exam_registrations (id, tenant_id, exam_id, student_admission_id, registration_number, roll_number, hall_ticket_number, registration_status, is_eligible)
VALUES 
    ('2e000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2d000000-0000-0000-0000-000000000001', '2f000000-0000-0000-0000-000000000100', 'REG0001', 'ROLL001', 'HALL001', 'REGISTERED', true)
ON CONFLICT (exam_id, student_admission_id) DO NOTHING;

-- 5. Seed exam attempt
INSERT INTO public.exam_attempts (id, tenant_id, exam_id, student_admission_id, status, started_at, submitted_at)
VALUES 
    ('2f000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2d000000-0000-0000-0000-000000000001', '2f000000-0000-0000-0000-000000000100', 'SUBMITTED', now() - interval '1 hour', now() - interval '45 minutes')
ON CONFLICT (exam_id, student_admission_id) DO NOTHING;
