-- ============================================================================
-- SQL File: 001_people_procedures.sql
-- Domain: Student & Staff Lifecycle Operations Procedures
-- ============================================================================

SET search_path = public;

-- 1. Promote Student procedure
CREATE OR REPLACE PROCEDURE public.sp_promote_student(
    p_tenant_id UUID,
    p_student_id UUID,
    p_new_academic_year_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status VARCHAR(50);
BEGIN
    SELECT academic_status::VARCHAR INTO v_old_status
    FROM public.student_profiles
    WHERE user_id = p_student_id AND tenant_id = p_tenant_id;
    
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Student profile not found in tenant';
    END IF;

    -- Update admissions registration
    UPDATE public.student_admissions
    SET academic_year_id = p_new_academic_year_id,
        updated_at = NOW()
    WHERE student_profile_id = p_student_id
      AND tenant_id = p_tenant_id;

    -- Log status history
    INSERT INTO public.student_status_history (
        student_profile_id, tenant_id, from_status, to_status, reason
    ) VALUES (
        p_student_id, p_tenant_id, v_old_status, 'PROMOTED', 'Academic Year promotion sequence executed'
    );
    
    -- Increment profile version
    UPDATE public.student_profiles
    SET profile_version = profile_version + 1,
        last_profile_updated_at = NOW()
    WHERE user_id = p_student_id;
END;
$$;

-- 2. Transfer Student Batch enrollment mapping
CREATE OR REPLACE PROCEDURE public.sp_transfer_batch(
    p_tenant_id UUID,
    p_student_id UUID,
    p_from_batch_id UUID,
    p_to_batch_id UUID,
    p_reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_admission_id UUID;
BEGIN
    -- Resolve student admission record id
    SELECT id INTO v_admission_id
    FROM public.student_admissions
    WHERE student_profile_id = p_student_id
      AND tenant_id = p_tenant_id
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_admission_id IS NULL THEN
        RAISE EXCEPTION 'Active admission record not found for student';
    END IF;

    -- Terminate previous batch mapping
    UPDATE public.student_batch_enrollments
    SET status = 'COMPLETED',
        left_at = CURRENT_DATE,
        updated_at = NOW()
    WHERE student_admission_id = v_admission_id
      AND batch_id = p_from_batch_id
      AND status = 'ACTIVE'
      AND tenant_id = p_tenant_id;

    -- Insert target batch mapping
    INSERT INTO public.student_batch_enrollments (
        student_admission_id, tenant_id, batch_id, status, joined_at
    ) VALUES (
        v_admission_id, p_tenant_id, p_to_batch_id, 'ACTIVE', CURRENT_DATE
    );
END;
$$;

-- 3. Archive Student (Marks user status as LEFT/SUSPENDED)
CREATE OR REPLACE PROCEDURE public.sp_archive_student(
    p_tenant_id UUID,
    p_student_id UUID,
    p_archive_reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_admission_id UUID;
BEGIN
    SELECT academic_status::VARCHAR INTO v_old_status
    FROM public.student_profiles
    WHERE user_id = p_student_id AND tenant_id = p_tenant_id;

    UPDATE public.student_profiles
    SET academic_status = 'WITHDRAWN',
        profile_version = profile_version + 1,
        last_profile_updated_at = NOW()
    WHERE user_id = p_student_id AND tenant_id = p_tenant_id;

    -- Resolve student admission record id
    SELECT id INTO v_admission_id
    FROM public.student_admissions
    WHERE student_profile_id = p_student_id
      AND tenant_id = p_tenant_id
      AND deleted_at IS NULL
    LIMIT 1;

    -- Deactivate batch enrollments
    IF v_admission_id IS NOT NULL THEN
        UPDATE public.student_batch_enrollments
        SET status = 'CANCELLED',
            left_at = CURRENT_DATE,
            updated_at = NOW()
        WHERE student_admission_id = v_admission_id
          AND status = 'ACTIVE'
          AND tenant_id = p_tenant_id;
    END IF;

    -- Log status history
    INSERT INTO public.student_status_history (
        student_profile_id, tenant_id, from_status, to_status, reason
    ) VALUES (
        p_student_id, p_tenant_id, v_old_status, 'LEFT', p_archive_reason
    );
END;
$$;

-- 4. Merge duplicate parent records
CREATE OR REPLACE PROCEDURE public.sp_merge_duplicate_parent(
    p_tenant_id UUID,
    p_source_parent_id UUID,
    p_target_parent_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete mappings for source parent that already exist for target parent
    DELETE FROM public.student_parents
    WHERE parent_profile_id = p_source_parent_id
      AND tenant_id = p_tenant_id
      AND student_profile_id IN (
          SELECT student_profile_id FROM public.student_parents WHERE parent_profile_id = p_target_parent_id
      );

    -- Move remaining student mappings to target parent
    UPDATE public.student_parents
    SET parent_profile_id = p_target_parent_id,
        updated_at = NOW()
    WHERE parent_profile_id = p_source_parent_id
      AND tenant_id = p_tenant_id;

    -- Delete leftover source relationships
    DELETE FROM public.student_parents
    WHERE parent_profile_id = p_source_parent_id
      AND tenant_id = p_tenant_id;

    -- Soft delete duplicate parent profile
    UPDATE public.parent_profiles
    SET deleted_at = NOW()
    WHERE user_id = p_source_parent_id
      AND tenant_id = p_tenant_id;
END;
$$;

-- 5. Bulk assign students to batch
CREATE OR REPLACE PROCEDURE public.sp_bulk_assign_batch(
    p_tenant_id UUID,
    p_student_ids UUID[],
    p_batch_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_sid UUID;
    v_admission_id UUID;
BEGIN
    FOREACH v_sid IN ARRAY p_student_ids LOOP
        -- Resolve admission reference
        SELECT id INTO v_admission_id
        FROM public.student_admissions
        WHERE student_profile_id = v_sid
          AND tenant_id = p_tenant_id
          AND deleted_at IS NULL
        LIMIT 1;

        IF v_admission_id IS NOT NULL THEN
            -- Deactivate old active mapping
            UPDATE public.student_batch_enrollments
            SET status = 'COMPLETED',
                left_at = CURRENT_DATE,
                updated_at = NOW()
            WHERE student_admission_id = v_admission_id
              AND status = 'ACTIVE'
              AND tenant_id = p_tenant_id;

            -- Assign to target batch
            INSERT INTO public.student_batch_enrollments (
                student_admission_id, tenant_id, batch_id, status, joined_at
            ) VALUES (
                v_admission_id, p_tenant_id, p_batch_id, 'ACTIVE', CURRENT_DATE
            );
        END IF;
    END LOOP;
END;
$$;

-- 6. Year-end Graduation procedure
CREATE OR REPLACE PROCEDURE public.sp_graduate_students(
    p_tenant_id UUID,
    p_batch_id UUID,
    p_notes TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_student RECORD;
BEGIN
    FOR v_student IN 
        SELECT sbe.student_admission_id, sa.student_profile_id
        FROM public.student_batch_enrollments sbe
        JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id
        WHERE sbe.batch_id = p_batch_id 
          AND sbe.status = 'ACTIVE' 
          AND sbe.tenant_id = p_tenant_id
    LOOP
        -- Archive student to ALUMNI status
        UPDATE public.student_profiles
        SET academic_status = 'ALUMNI',
            profile_version = profile_version + 1,
            last_profile_updated_at = NOW()
        WHERE user_id = v_student.student_profile_id;

        -- Terminate batch enrollment
        UPDATE public.student_batch_enrollments
        SET status = 'COMPLETED',
            left_at = CURRENT_DATE,
            updated_at = NOW()
        WHERE student_admission_id = v_student.student_admission_id
          AND batch_id = p_batch_id;

        -- Log status history
        INSERT INTO public.student_status_history (
            student_profile_id, tenant_id, from_status, to_status, reason
        ) VALUES (
            v_student.student_profile_id, p_tenant_id, 'ACTIVE', 'GRADUATED', p_notes
        );
    END LOOP;
END;
$$;

-- 7. Restore Student status procedure
CREATE OR REPLACE PROCEDURE public.sp_restore_student(
    p_tenant_id UUID,
    p_student_id UUID,
    p_restore_reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status VARCHAR(50);
BEGIN
    SELECT academic_status::VARCHAR INTO v_old_status
    FROM public.student_profiles
    WHERE user_id = p_student_id AND tenant_id = p_tenant_id;

    UPDATE public.student_profiles
    SET academic_status = 'ACTIVE',
        profile_version = profile_version + 1,
        last_profile_updated_at = NOW()
    WHERE user_id = p_student_id AND tenant_id = p_tenant_id;

    -- Log status history
    INSERT INTO public.student_status_history (
        student_profile_id, tenant_id, from_status, to_status, reason
    ) VALUES (
        p_student_id, p_tenant_id, v_old_status, 'ACTIVE', p_restore_reason
    );
END;
$$;
