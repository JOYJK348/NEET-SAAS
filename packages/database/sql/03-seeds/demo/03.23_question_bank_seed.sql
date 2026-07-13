-- ============================================================================
-- SQL Seed File: 03.23_question_bank_seed.sql
-- Domain: Question Bank Demo Seeding (Physics mechanics questions)
-- ============================================================================

SET search_path = public;

-- Seed questions
INSERT INTO public.questions (id, tenant_id, subject_id, chapter_id, topic_id, question_code, question_text, question_type, difficulty, blooms_level, language, source, question_status)
VALUES 
    -- Question 1: Physics Mechanics (using valid hex uuid starting with 2b...)
    ('2b000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000011', '1c000000-0000-0000-0000-000000000011', '1d000000-0000-0000-0000-000000000011', 'PHY-MECH-MCQ-001', 'A body of mass 2 kg is sliding down a frictionless inclined plane of angle 30 degrees. What is the acceleration of the body?', 'MCQ', 'MEDIUM', 'APPLY', 'EN', 'MANUAL', 'PUBLISHED'),
    
    -- Question 2: Chemistry Hydrocarbons
    ('2b000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000012', '1c000000-0000-0000-0000-000000000012', '1d000000-0000-0000-0000-000000000012', 'CHM-ORG-MCQ-001', 'Which of the following hydrocarbons is most acidic in nature?', 'MCQ', 'HARD', 'ANALYZE', 'EN', 'MANUAL', 'PUBLISHED')
ON CONFLICT (tenant_id, id) DO UPDATE 
SET 
    question_text = EXCLUDED.question_text,
    question_status = EXCLUDED.question_status,
    version = questions.version + 1
WHERE questions.question_text IS DISTINCT FROM EXCLUDED.question_text 
   OR questions.question_status IS DISTINCT FROM EXCLUDED.question_status;

-- Seed question options
INSERT INTO public.question_options (id, tenant_id, question_id, option_order, option_label, option_text, is_correct)
VALUES
    -- Options for Question 1
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 1, 'A', '4.9 m/s^2', true),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 2, 'B', '9.8 m/s^2', false),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 3, 'C', '2.45 m/s^2', false),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 4, 'D', '0 m/s^2', false),

    -- Options for Question 2
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000002', 1, 'A', 'Ethyne (Acetylene)', true),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000002', 2, 'B', 'Ethene', false),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000002', 3, 'C', 'Ethane', false),
    (generate_primary_key(), 'a0000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000002', 4, 'D', 'Benzene', false)
ON CONFLICT (question_id, option_label) DO NOTHING;
