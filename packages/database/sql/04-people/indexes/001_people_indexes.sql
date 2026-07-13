-- ============================================================================
-- SQL File: 001_people_indexes.sql
-- Domain: Database Performance Indexes for Context 04-People
-- ============================================================================

SET search_path = public;

-- 1. B-Tree Indexes on foreign keys for join performance
CREATE INDEX IF NOT EXISTS idx_sba_staff_fk ON public.staff_batch_assignments(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_sba_batch_fk ON public.staff_batch_assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_sba_subject_fk ON public.staff_batch_assignments(subject_id);

CREATE INDEX IF NOT EXISTS idx_smp_student_fk ON public.student_medical_profiles(student_profile_id);

CREATE INDEX IF NOT EXISTS idx_sq_staff_fk ON public.staff_qualifications(staff_profile_id);

CREATE INDEX IF NOT EXISTS idx_ec_student_fk ON public.emergency_contacts(student_profile_id);

CREATE INDEX IF NOT EXISTS idx_ssh_student_fk ON public.student_status_history(student_profile_id);

CREATE INDEX IF NOT EXISTS idx_pi_student_fk ON public.person_identifiers(student_profile_id);

-- 2. GIN Full-Text Search Index on User directory columns for lightning fast search queries
CREATE INDEX IF NOT EXISTS idx_users_search_gin ON public.users 
USING gin(
    to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(email, '')
    )
);

-- GIN Index on identifiers search fields
CREATE INDEX IF NOT EXISTS idx_pi_value_trgm ON public.person_identifiers(identifier_value);
