-- ============================================================================
-- SQL Seed File: 03.19_parent_profiles_seed.sql
-- Domain: Parent Profiles & Student-Parent Mapping Demo Seeding
-- ============================================================================

SET search_path = public;

-- Seed Parent Profile
INSERT INTO public.parent_profiles (user_id, tenant_id, occupation, education_level)
VALUES 
    -- Ramanathan K (using valid hex UUID starting with 3b...)
    ('3b000000-0000-0000-0000-000000000200', 'a0000000-0000-0000-0000-000000000001', 'Engineer', 'Post Graduate')
ON CONFLICT (user_id) DO NOTHING;

-- Map Parent to Student (Ramanathan mapped as FATHER to Karthik - referencing 3b... UUIDs)
INSERT INTO public.student_parents (student_profile_id, parent_profile_id, tenant_id, relationship_type, is_primary_guardian)
VALUES 
    ('3b000000-0000-0000-0000-000000000100', '3b000000-0000-0000-0000-000000000200', 'a0000000-0000-0000-0000-000000000001', 'FATHER', true)
ON CONFLICT (student_profile_id, parent_profile_id) DO NOTHING;
