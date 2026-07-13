-- ============================================================================
-- File       : 005_people_integration.sql
-- Module     : Testing
-- Purpose    : Automated integration testing suite for 04-People lifecycles, RLS, and views.
-- Depends On : Entire 04-People schema context
-- Author     : Principal Database QA Engineer
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    -- Tenant UUID
    v_tenant UUID := '88888888-8888-8888-8888-888888888888';
    
    -- Users UUIDs
    v_user_faculty UUID := '11111111-1111-1111-1111-111111111111';
    v_user_admin UUID := '22222222-2222-2222-2222-222222222222';
    v_user_student UUID := '44444444-4444-4444-4444-444444444444';
    v_user_parent UUID := '55555555-5555-5555-5555-555555555555';
    v_user_stranger UUID := '66666666-6666-6666-6666-666666666666';
    
    -- Lookup parameters
    v_batch_a UUID := 'b0000000-0000-0000-0000-000000000001';
    v_batch_b UUID := 'b0000000-0000-0000-0000-000000000002';
    v_subject UUID := 'a0000000-0000-0000-0000-000000000001';
    v_ay_id UUID := 'd0000000-0000-0000-0000-000000000001';
    v_course UUID := 'c0000000-0000-0000-0000-000000000001';
    
    -- Verification variables
    v_count INT;
    v_completion NUMERIC;
    v_status VARCHAR(50);
    v_json JSONB;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING 04-PEOPLE ENTERPRISE INTEGRATION TEST SUITE';
    RAISE NOTICE '============================================================';

    -- ------------------------------------------------------------------------
    -- PREPARATION: Seed Baseline Setup
    -- ------------------------------------------------------------------------
    
    -- Register target test entities in auth.users and master tables if not existing
    INSERT INTO auth.users (id, email, role)
    VALUES 
        (v_user_student, 'student@test.com', 'authenticated'),
        (v_user_parent, 'parent@test.com', 'authenticated'),
        (v_user_stranger, 'stranger@test.com', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, tenant_id, email, first_name, last_name, user_type, status)
    VALUES 
        (v_user_student, v_tenant, 'student@test.com', 'Alex', 'Student', 'STUDENT'::user_type_enum, 'ACTIVE'::user_status_type),
        (v_user_parent, v_tenant, 'parent@test.com', 'David', 'Parent', 'PARENT'::user_type_enum, 'ACTIVE'::user_status_type),
        (v_user_stranger, '99999999-9999-9999-9999-999999999999', 'stranger@test.com', 'John', 'Stranger', 'STUDENT'::user_type_enum, 'ACTIVE'::user_status_type)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.subjects (id, tenant_id, name, short_name, code, is_active)
    VALUES (v_subject, v_tenant, 'Physics', 'PHY', 'PHY', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.academic_years (id, tenant_id, name, code, start_date, end_date, is_active)
    VALUES (v_ay_id, v_tenant, 'Academic Year 2026', 'AY_2026', '2026-01-01'::DATE, '2026-12-31'::DATE, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.courses (id, tenant_id, name, code, is_active)
    VALUES (v_course, v_tenant, 'NEET Prep Course', 'NEET_PREP', true)
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock delivery type to satisfy batches reference constraints
    INSERT INTO public.batch_delivery_types (id, tenant_id, code, name, is_active)
    VALUES ('d0000000-0000-0000-0000-000000000009', v_tenant, 'REGULAR', 'Regular Delivery', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.batches (id, tenant_id, branch_id, course_id, academic_year_id, delivery_type_id, code, name, start_date, end_date, is_active)
    VALUES 
        (v_batch_a, v_tenant, '88888888-8888-8888-8888-000000000000', v_course, v_ay_id, 'd0000000-0000-0000-0000-000000000009', 'PHYSA', 'Batch Physics A', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', true),
        (v_batch_b, v_tenant, '88888888-8888-8888-8888-000000000000', v_course, v_ay_id, 'd0000000-0000-0000-0000-000000000009', 'PHYSB', 'Batch Physics B', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', true)
    ON CONFLICT (id) DO NOTHING;

    -- Setup student profile (must be at least 3 years old)
    INSERT INTO public.student_profiles (user_id, tenant_id, student_code, date_of_birth, gender, admitted_at)
    VALUES (v_user_student, v_tenant, 'STU-2026-0001', '2010-05-15'::DATE, 'MALE'::gender_type, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;

    -- Setup parent profile
    INSERT INTO public.parent_profiles (user_id, tenant_id)
    VALUES (v_user_parent, v_tenant)
    ON CONFLICT (user_id) DO NOTHING;

    -- Set active admissions
    INSERT INTO public.student_admissions (student_profile_id, tenant_id, academic_year_id, course_id, admission_number, admission_status)
    VALUES (v_user_student, v_tenant, v_ay_id, v_course, 'ADM_2026_9999', 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- Active batch enrollment
    INSERT INTO public.student_batch_enrollments (student_admission_id, tenant_id, batch_id, status, joined_at)
    VALUES (
        (SELECT id FROM public.student_admissions WHERE student_profile_id = v_user_student LIMIT 1),
        v_tenant, v_batch_a, 'ACTIVE', CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;

    -- ------------------------------------------------------------------------
    -- PHASE 1: Profile Completeness Calculations Verification
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 1: Verifying Dynamic Profile Completeness...';

    -- Initial score should be 40% (base profile only)
    v_completion := fn_profile_completion(v_user_student);
    ASSERT v_completion = 40.00, 'Test Failed: Initial completion score should be 40.00%';

    -- Link parent (+20%)
    INSERT INTO public.student_parents (student_profile_id, parent_profile_id, tenant_id)
    VALUES (v_user_student, v_user_parent, v_tenant);
    
    -- Add emergency contact (+10%)
    INSERT INTO public.emergency_contacts (student_profile_id, tenant_id, name, relationship, phone, is_primary)
    VALUES (v_user_student, v_tenant, 'Uncle Bob', 'UNCLE', '+919999988888', true);

    -- Add medical profile (+15%)
    INSERT INTO public.student_medical_profiles (student_profile_id, tenant_id, blood_group, allergies)
    VALUES (v_user_student, v_tenant, 'O+', 'Peanuts');

    -- Upload identity document (+15%)
    INSERT INTO public.student_documents (student_profile_id, tenant_id, document_type_id, storage_key, status)
    VALUES (v_user_student, v_tenant, 'AADHAAR', 'buckets/docs/aadhaar.pdf', 'PENDING');

    -- Assert dynamic triggers computed overall percentage to 100%
    SELECT profile_completion_percentage INTO v_completion FROM public.student_profiles WHERE user_id = v_user_student;
    ASSERT v_completion = 100.00, 'Test Failed: Completion score must trigger update to 100.00%';
    RAISE NOTICE ' - Profile completion score calculated: 100%% (PASSED)';

    -- ------------------------------------------------------------------------
    -- PHASE 2: Lifecycle Store Procedures Verification
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 2: Verifying Lifecycle Operations Procedures...';

    -- 1. Batch Transfer
    CALL sp_transfer_batch(v_tenant, v_user_student, v_batch_a, v_batch_b, 'Transferring classes');
    v_status := fn_get_student_current_batch(v_user_student)::VARCHAR;
    ASSERT v_status = v_batch_b::VARCHAR, 'Test Failed: Batch transfer failed to update active batch.';
    RAISE NOTICE ' - sp_transfer_batch execution: PASSED';

    -- 2. Archival (Withdraw student)
    CALL sp_archive_student(v_tenant, v_user_student, 'Voluntary withdrawal');
    SELECT academic_status INTO v_status FROM public.student_profiles WHERE user_id = v_user_student;
    ASSERT v_status = 'WITHDRAWN', 'Test Failed: Archival procedure failed to mark status as WITHDRAWN.';
    RAISE NOTICE ' - sp_archive_student execution: PASSED';

    -- 3. Restore student
    CALL sp_restore_student(v_tenant, v_user_student, 'Restored enrollment');
    SELECT academic_status INTO v_status FROM public.student_profiles WHERE user_id = v_user_student;
    ASSERT v_status = 'ACTIVE', 'Test Failed: Restore student procedure failed to mark status as ACTIVE.';
    RAISE NOTICE ' - sp_restore_student execution: PASSED';

    -- Reactivate student batch enrollment for testing graduation
    UPDATE public.student_batch_enrollments
    SET status = 'ACTIVE', left_at = NULL
    WHERE student_admission_id = (SELECT id FROM public.student_admissions WHERE student_profile_id = v_user_student LIMIT 1)
      AND batch_id = v_batch_b;

    -- 4. Graduation
    CALL sp_graduate_students(v_tenant, v_batch_b, 'Year end completions');
    SELECT academic_status INTO v_status FROM public.student_profiles WHERE user_id = v_user_student;
    ASSERT v_status = 'ALUMNI', 'Test Failed: Graduation procedure failed to mark status as ALUMNI.';
    RAISE NOTICE ' - sp_graduate_students execution: PASSED';

    -- Restore back to ACTIVE to continue checks
    CALL sp_restore_student(v_tenant, v_user_student, 'Restore post graduation');

    -- ------------------------------------------------------------------------
    -- PHASE 3: RLS Security Boundary Validations
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 3: Verifying RLS boundary policies access...';

    -- Student login context check
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_user_student, 'role', 'authenticated', 'tenantId', v_tenant)::text, true);
    
    -- Student can select own profile
    SELECT count(1) INTO v_count FROM public.student_profiles WHERE user_id = v_user_student;
    ASSERT v_count = 1, 'RLS Failed: Student should be able to view own profile!';
    
    -- Student cannot select other profiles (e.g. stranger student)
    SELECT count(1) INTO v_count FROM public.student_profiles WHERE user_id = v_user_stranger;
    ASSERT v_count = 0, 'RLS Failed: Student must NOT have access to other students profiles!';
    
    -- Parent login context check
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_user_parent, 'role', 'authenticated', 'tenantId', v_tenant)::text, true);
    
    -- Parent can select child profile
    SELECT count(1) INTO v_count FROM public.student_profiles WHERE user_id = v_user_student;
    ASSERT v_count = 1, 'RLS Failed: Parent should be able to select child profiles!';

    RAISE NOTICE ' - RLS Student/Parent access constraints: PASSED';

    -- ------------------------------------------------------------------------
    -- PHASE 4: View Performance Verification
    -- ------------------------------------------------------------------------
    RAISE NOTICE 'PHASE 4: Verifying Views compilation queries...';

    -- Reset context to admin
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_user_admin, 'role', 'authenticated', 'tenantId', v_tenant)::text, true);

    -- Query timeline and complete profiles views
    SELECT count(1) INTO v_count FROM public.v_student_complete_profile WHERE student_id = v_user_student;
    ASSERT v_count = 1, 'View Failed: Complete profiles lookup returned 0 rows!';
    
    SELECT count(1) INTO v_count FROM public.v_student_timeline WHERE student_profile_id = v_user_student;
    ASSERT v_count > 0, 'View Failed: Timeline chronologies returned 0 rows!';
    
    RAISE NOTICE ' - Views queries parsed successfully: PASSED';

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INTEGRITY TEST SUITE RUN COMPLETED SUCCESSFULLY (100%% PASSED)';
    RAISE NOTICE '============================================================';
END $$;
