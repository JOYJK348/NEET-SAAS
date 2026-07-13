-- ============================================================================
-- SQL File: 999_validation.sql
-- Domain: Database Integrity Verification Rules for Context 04-People
-- ============================================================================

DO $$
DECLARE
    v_errors_count INTEGER := 0;
    v_check RECORD;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING DATABASE VERIFICATION CHECKLIST (04-PEOPLE)';
    RAISE NOTICE '============================================================';

    -- 1. Check: Duplicate admission numbers mapped under the same tenant
    SELECT count(1) INTO v_errors_count
    FROM (
        SELECT tenant_id, admission_number, count(1) 
        FROM public.student_admissions 
        WHERE deleted_at IS NULL
        GROUP BY tenant_id, admission_number 
        HAVING count(1) > 1
    ) t;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 1 Failed: Duplicate admission numbers found under same tenant!';
    ELSE
        RAISE NOTICE 'Check 1 Passed: Zero duplicate admission numbers.';
    END IF;

    -- 2. Check: Duplicate roll numbers mapped under the same tenant
    SELECT count(1) INTO v_errors_count
    FROM (
        SELECT tenant_id, identifier_value, count(1)
        FROM public.person_identifiers
        WHERE identifier_type = 'ROLL_NO' AND deleted_at IS NULL AND is_active = true
        GROUP BY tenant_id, identifier_value
        HAVING count(1) > 1
    ) t;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 2 Failed: Duplicate roll numbers found under same tenant!';
    ELSE
        RAISE NOTICE 'Check 2 Passed: Zero duplicate active roll numbers.';
    END IF;

    -- 3. Check: Orphan parents profiles (no student mappings associated)
    SELECT count(1) INTO v_errors_count
    FROM public.parent_profiles pp
    LEFT JOIN public.student_parents sp ON sp.parent_profile_id = pp.user_id
    WHERE sp.student_profile_id IS NULL AND pp.deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 3 Failed: Found % orphan parent profiles!', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 3 Passed: Zero orphan parent profiles.';
    END IF;

    -- 4. Check: Orphan student admissions records (no student profile mapping)
    SELECT count(1) INTO v_errors_count
    FROM public.student_admissions sa
    LEFT JOIN public.student_profiles sp ON sp.user_id = sa.student_profile_id
    WHERE sp.user_id IS NULL AND sa.deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 4 Failed: Found % orphan student admissions!', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 4 Passed: Zero orphan student admissions.';
    END IF;

    -- 5. Check: Inactive batch enrollments listed as active mapping
    SELECT count(1) INTO v_errors_count
    FROM public.student_batch_enrollments sbe
    JOIN public.batches b ON b.id = sbe.batch_id
    WHERE sbe.status = 'ACTIVE' AND (sbe.deleted_at IS NOT NULL OR b.deleted_at IS NOT NULL);
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 5 Failed: Found % invalid active batch enrollments!', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 5 Passed: Zero inactive batch enrollments listed as active.';
    END IF;

    -- 6. Check: Future DOB validations (Date of Birth set in future)
    SELECT count(1) INTO v_errors_count
    FROM public.student_profiles
    WHERE date_of_birth >= CURRENT_DATE AND deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 6 Failed: Found student records with future date of birth!';
    ELSE
        RAISE NOTICE 'Check 6 Passed: Zero students with future Date of Birth.';
    END IF;

    -- 7. Check: Invalid guardian phone number formatting mapping
    SELECT count(1) INTO v_errors_count
    FROM public.emergency_contacts
    WHERE phone IS NULL AND deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 7 Failed: Found emergency contacts with missing phone numbers!';
    ELSE
        RAISE NOTICE 'Check 7 Passed: All emergency contacts contain phone numbers.';
    END IF;

    -- 8. Check: Duplicate staff codes within same tenant
    SELECT count(1) INTO v_errors_count
    FROM (
        SELECT tenant_id, employee_code, count(1) 
        FROM public.staff_profiles 
        WHERE deleted_at IS NULL
        GROUP BY tenant_id, employee_code 
        HAVING count(1) > 1
    ) t;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 8 Failed: Duplicate employee code records found!';
    ELSE
        RAISE NOTICE 'Check 8 Passed: Zero duplicate staff employee codes.';
    END IF;

    -- 9. Check: Multiple active admissions records for same student
    SELECT count(1) INTO v_errors_count
    FROM (
        SELECT student_profile_id, count(1)
        FROM public.student_admissions
        WHERE admission_status = 'ACTIVE' AND deleted_at IS NULL
        GROUP BY student_profile_id
        HAVING count(1) > 1
    ) t;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 9 Failed: Multiple active admissions found for same student!';
    ELSE
        RAISE NOTICE 'Check 9 Passed: Zero duplicate active student admissions.';
    END IF;

    -- 10. Check: Missing emergency contact associations (For active students)
    SELECT count(1) INTO v_errors_count
    FROM public.student_profiles sp
    LEFT JOIN public.emergency_contacts ec ON ec.student_profile_id = sp.user_id AND ec.deleted_at IS NULL
    WHERE sp.academic_status = 'ACTIVE' AND sp.deleted_at IS NULL AND ec.id IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 10 Warning: Found % active students without emergency contacts.', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 10 Passed: All active students contain emergency contacts.';
    END IF;

    -- 11. Check: Duplicate Aadhaar card identifiers
    SELECT count(1) INTO v_errors_count
    FROM (
        SELECT tenant_id, identifier_value, count(1)
        FROM public.person_identifiers
        WHERE identifier_type = 'AADHAAR' AND deleted_at IS NULL AND is_active = true
        GROUP BY tenant_id, identifier_value
        HAVING count(1) > 1
    ) t;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 11 Failed: Duplicate active Aadhaar numbers found!';
    ELSE
        RAISE NOTICE 'Check 11 Passed: Zero duplicate Aadhaar identifiers.';
    END IF;

    -- 12. Check: Duplicate Government EMIS identifiers
    SELECT count(1) INTO v_errors_count
    FROM (
        SELECT tenant_id, identifier_value, count(1)
        FROM public.person_identifiers
        WHERE identifier_type = 'GOVT_EMIS' AND deleted_at IS NULL AND is_active = true
        GROUP BY tenant_id, identifier_value
        HAVING count(1) > 1
    ) t;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 12 Failed: Duplicate EMIS identifiers found!';
    ELSE
        RAISE NOTICE 'Check 12 Passed: Zero duplicate Government EMIS numbers.';
    END IF;

    -- 13. Check: Expired student documents verification status
    SELECT count(1) INTO v_errors_count
    FROM public.student_documents
    WHERE expiry_date < CURRENT_DATE AND status = 'VERIFIED' AND deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 13 Warning: Found % verified documents past their expiry date!', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 13 Passed: Zero expired document verifications.';
    END IF;

    -- 14. Check: Profile Completion less than 40% (base profiles should be at least 40)
    SELECT count(1) INTO v_errors_count
    FROM public.student_profiles
    WHERE profile_completion_percentage < 40.00 AND deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 14 Failed: Found students with profile completion less than base 40%%!';
    ELSE
        RAISE NOTICE 'Check 14 Passed: All profiles satisfy minimum completeness percentage.';
    END IF;

    -- 15. Check: Faculty without departments assignments
    SELECT count(1) INTO v_errors_count
    FROM public.staff_profiles sf
    LEFT JOIN public.staff_departments sd ON sd.staff_profile_id = sf.user_id AND sd.is_active = true AND sd.deleted_at IS NULL
    WHERE sf.deleted_at IS NULL AND sd.department_id IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 15 Warning: Found % faculty members with no department assignments.', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 15 Passed: All faculty are assigned to departments.';
    END IF;

    -- 16. Check: Active students without admission records
    SELECT count(1) INTO v_errors_count
    FROM public.student_profiles sp
    LEFT JOIN public.student_admissions sa ON sa.student_profile_id = sp.user_id AND sa.deleted_at IS NULL
    WHERE sp.academic_status = 'ACTIVE' AND sp.deleted_at IS NULL AND sa.id IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 16 Failed: Active students found with missing admissions records!';
    ELSE
        RAISE NOTICE 'Check 16 Passed: All active students contain admission profiles.';
    END IF;

    -- 17. Check: Active students without active batch enrollments
    SELECT count(1) INTO v_errors_count
    FROM public.student_profiles sp
    LEFT JOIN public.student_admissions sa ON sa.student_profile_id = sp.user_id AND sa.deleted_at IS NULL
    LEFT JOIN public.student_batch_enrollments sbe ON sbe.student_admission_id = sa.id AND sbe.status = 'ACTIVE' AND sbe.deleted_at IS NULL
    WHERE sp.academic_status = 'ACTIVE' AND sp.deleted_at IS NULL AND sbe.id IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 17 Warning: Found % active students with no active batch enrollment.', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 17 Passed: Active student batch mappings fully aligned.';
    END IF;

    -- 18. Check: Invalid effective dates in staff assignments
    SELECT count(1) INTO v_errors_count
    FROM public.staff_batch_assignments
    WHERE effective_to < effective_from AND deleted_at IS NULL;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 18 Failed: Invalid effective date limits in assignments!';
    ELSE
        RAISE NOTICE 'Check 18 Passed: Effective date sequences verified.';
    END IF;

    -- 19. Check: Batches containing zero active students
    SELECT count(1) INTO v_errors_count
    FROM public.v_batch_strength
    WHERE active_students_count = 0;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 19 Warning: Found % empty batches containing zero active enrollments.', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 19 Passed: All active batches contain active student rosters.';
    END IF;

    -- 20. Check: Parent records mapped to zero students (orphan parents check)
    SELECT count(1) INTO v_errors_count
    FROM public.v_parent_directory
    WHERE associated_students_count = 0;
    IF v_errors_count > 0 THEN
        RAISE WARNING 'Check 20 Warning: Found % parent profiles with zero associated children.', v_errors_count;
    ELSE
        RAISE NOTICE 'Check 20 Passed: All parent profiles map to active children.';
    END IF;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'DATABASE VERIFICATION COMPLETED';
    RAISE NOTICE '============================================================';
END $$;
