-- ============================================================================
-- SQL File: 001_people_functions.sql
-- Domain: Student & Staff Utility Functions Layer
-- ============================================================================

SET search_path = public;

-- 1. Student Current Batch resolver
CREATE OR REPLACE FUNCTION public.fn_get_student_current_batch(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_batch_id UUID;
BEGIN
    SELECT sbe.batch_id INTO v_batch_id
    FROM public.student_batch_enrollments sbe
    JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
    WHERE sa.student_profile_id = p_student_id
      AND sbe.status = 'ACTIVE'
      AND sbe.deleted_at IS NULL
    LIMIT 1;
    RETURN v_batch_id;
END;
$$;

-- 2. Student Current Academic Year resolver
CREATE OR REPLACE FUNCTION public.fn_get_student_current_academic_year(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_ay_id UUID;
BEGIN
    SELECT academic_year_id INTO v_ay_id
    FROM public.student_admissions
    WHERE student_profile_id = p_student_id
      AND status = 'ADMITTED'
      AND deleted_at IS NULL
    LIMIT 1;
    RETURN v_ay_id;
END;
$$;

-- 3. Get Student Parents IDs array
CREATE OR REPLACE FUNCTION public.fn_get_student_parents(p_student_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_parents UUID[];
BEGIN
    SELECT array_agg(parent_profile_id) INTO v_parents
    FROM public.student_parents
    WHERE student_profile_id = p_student_id
      AND deleted_at IS NULL;
    RETURN COALESCE(v_parents, ARRAY[]::UUID[]);
END;
$$;

-- 4. Get Parent Students IDs array
CREATE OR REPLACE FUNCTION public.fn_get_parent_students(p_parent_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_students UUID[];
BEGIN
    SELECT array_agg(student_profile_id) INTO v_students
    FROM public.student_parents
    WHERE parent_profile_id = p_parent_id
      AND deleted_at IS NULL;
    RETURN COALESCE(v_students, ARRAY[]::UUID[]);
END;
$$;

-- 5. Resolve active staff department
CREATE OR REPLACE FUNCTION public.fn_get_staff_department(p_staff_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_dept_id UUID;
BEGIN
    SELECT department_id INTO v_dept_id
    FROM public.staff_departments
    WHERE staff_profile_id = p_staff_id
      AND is_active = true
      AND deleted_at IS NULL
    LIMIT 1;
    RETURN v_dept_id;
END;
$$;

-- 6. Boolean check if faculty is assigned to batch
CREATE OR REPLACE FUNCTION public.fn_is_batch_faculty(p_batch_id UUID, p_faculty_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.staff_batch_assignments
        WHERE batch_id = p_batch_id
          AND staff_profile_id = p_faculty_id
          AND is_active = true
          AND deleted_at IS NULL
    ) INTO v_exists;
    RETURN v_exists;
END;
$$;

-- 7. Boolean active check
CREATE OR REPLACE FUNCTION public.fn_student_is_active(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_status academic_status_enum;
BEGIN
    SELECT academic_status INTO v_status
    FROM public.student_profiles
    WHERE user_id = p_student_id;
    RETURN (v_status = 'ACTIVE');
END;
$$;

-- 8. Resolves full profile as JSONB details
CREATE OR REPLACE FUNCTION public.fn_get_student_full_profile(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_profile JSONB;
BEGIN
    SELECT jsonb_build_object(
        'student_id', sp.user_id,
        'student_code', sp.student_code,
        'gender', sp.gender,
        'date_of_birth', sp.date_of_birth,
        'academic_status', sp.academic_status,
        'completion_percentage', sp.profile_completion_percentage
    ) INTO v_profile
    FROM public.student_profiles sp
    WHERE sp.user_id = p_student_id;
    RETURN v_profile;
END;
$$;

-- 9. Resolve staff permission key details
CREATE OR REPLACE FUNCTION public.fn_get_staff_permissions(p_staff_id UUID)
RETURNS VARCHAR[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_perms VARCHAR[];
BEGIN
    SELECT array_agg(DISTINCT permission_key) INTO v_perms
    FROM fn_get_user_permissions((SELECT tenant_id FROM users WHERE id = p_staff_id), p_staff_id);
    RETURN COALESCE(v_perms, ARRAY[]::VARCHAR[]);
END;
$$;

-- 10. Multi-role directory search
CREATE OR REPLACE FUNCTION public.fn_search_people(p_tenant_id UUID, p_query VARCHAR, p_role_filter VARCHAR)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email VARCHAR(150),
    role VARCHAR(30)
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id, 
        concat_ws(' ', u.first_name, u.last_name) AS name, 
        u.email,
        u.user_type::VARCHAR AS role
    FROM public.users u
    WHERE u.tenant_id = p_tenant_id
      AND u.deleted_at IS NULL
      AND (p_role_filter IS NULL OR u.user_type::VARCHAR = p_role_filter)
      AND (
          u.first_name ILIKE '%' || p_query || '%'
          OR u.last_name ILIKE '%' || p_query || '%'
          OR u.email ILIKE '%' || p_query || '%'
      )
    LIMIT 50;
END;
$$;

-- 11. Student status lookup
CREATE OR REPLACE FUNCTION public.fn_get_student_status(p_student_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_status VARCHAR;
BEGIN
    SELECT academic_status::VARCHAR INTO v_status
    FROM public.student_profiles
    WHERE user_id = p_student_id;
    RETURN COALESCE(v_status, 'UNKNOWN');
END;
$$;

-- 12. Student age resolver
CREATE OR REPLACE FUNCTION public.fn_get_student_age(p_student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_dob DATE;
BEGIN
    SELECT date_of_birth INTO v_dob
    FROM public.student_profiles
    WHERE user_id = p_student_id;
    RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, v_dob))::INTEGER;
END;
$$;

-- 13. Is student actively enrolled in batch
CREATE OR REPLACE FUNCTION public.fn_is_student_enrolled(p_student_id UUID, p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_enrolled BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.student_batch_enrollments sbe
        JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
        WHERE sa.student_profile_id = p_student_id
          AND sbe.batch_id = p_batch_id
          AND sbe.status = 'ACTIVE'
          AND sbe.deleted_at IS NULL
    ) INTO v_enrolled;
    RETURN v_enrolled;
END;
$$;

-- 14. Batch Strength Counter
CREATE OR REPLACE FUNCTION public.fn_get_batch_strength(p_batch_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(1) INTO v_count
    FROM public.student_batch_enrollments
    WHERE batch_id = p_batch_id
      AND status = 'ACTIVE'
      AND deleted_at IS NULL;
    RETURN v_count;
END;
$$;

-- 15. Resolve batches a staff member teaches
CREATE OR REPLACE FUNCTION public.fn_get_staff_batches(p_staff_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_batches UUID[];
BEGIN
    SELECT array_agg(DISTINCT batch_id) INTO v_batches
    FROM public.staff_batch_assignments
    WHERE staff_profile_id = p_staff_id
      AND is_active = true
      AND deleted_at IS NULL;
    RETURN COALESCE(v_batches, ARRAY[]::UUID[]);
END;
$$;

-- 16. Get Student Contacts Details
CREATE OR REPLACE FUNCTION public.fn_get_student_contact(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_contact JSONB;
BEGIN
    SELECT jsonb_build_object(
        'email', email,
        'phone', NULL::VARCHAR
    ) INTO v_contact
    FROM public.users
    WHERE id = p_student_id;
    RETURN v_contact;
END;
$$;

-- 17. Get Primary Parent User ID
CREATE OR REPLACE FUNCTION public.fn_get_primary_parent(p_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    SELECT parent_profile_id INTO v_parent_id
    FROM public.student_parents
    WHERE student_profile_id = p_student_id
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;
    RETURN v_parent_id;
END;
$$;

-- 18. RLS access evaluator
CREATE OR REPLACE FUNCTION public.fn_can_access_student(p_user_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_type user_type_enum;
    v_tenant_id UUID;
    v_student_tenant UUID;
    v_authorized BOOLEAN := false;
BEGIN
    SELECT user_type, tenant_id INTO v_user_type, v_tenant_id
    FROM public.users
    WHERE id = p_user_id AND deleted_at IS NULL;
    
    SELECT tenant_id INTO v_student_tenant
    FROM public.student_profiles
    WHERE user_id = p_student_id AND deleted_at IS NULL;

    IF v_tenant_id <> v_student_tenant THEN
        RETURN false;
    END IF;

    IF p_user_id = p_student_id THEN
        RETURN true;
    ELSIF v_user_type = 'STAFF'::user_type_enum THEN
        RETURN true;
    ELSIF v_user_type = 'PARENT'::user_type_enum THEN
        SELECT EXISTS (
            SELECT 1 FROM public.student_parents
            WHERE student_profile_id = p_student_id
              AND parent_profile_id = p_user_id
              AND deleted_at IS NULL
        ) INTO v_authorized;
        RETURN v_authorized;
    END IF;

    RETURN false;
END;
$$;

-- 19. Dashboard directory metric counts
CREATE OR REPLACE FUNCTION public.fn_people_dashboard_counts(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_students INT;
    v_staff INT;
    v_parents INT;
BEGIN
    SELECT count(1) INTO v_students FROM public.student_profiles WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;
    SELECT count(1) INTO v_staff FROM public.staff_profiles WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;
    SELECT count(1) INTO v_parents FROM public.parent_profiles WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object(
        'total_students', v_students,
        'total_staff', v_staff,
        'total_parents', v_parents
    );
END;
$$;

-- 20. Get Student emergency guardians
CREATE OR REPLACE FUNCTION public.fn_get_student_guardians(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_guardians JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'name', name,
        'relationship', relationship,
        'phone', phone,
        'is_primary', is_primary
    )) INTO v_guardians
    FROM public.emergency_contacts
    WHERE student_profile_id = p_student_id
      AND deleted_at IS NULL;
    RETURN COALESCE(v_guardians, '[]'::jsonb);
END;
$$;

-- 21. Get Student documents list
CREATE OR REPLACE FUNCTION public.fn_get_student_documents(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_docs JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'document_type_id', document_type_id,
        'status', status,
        'storage_key', storage_key
    )) INTO v_docs
    FROM public.student_documents
    WHERE student_profile_id = p_student_id
      AND deleted_at IS NULL;
    RETURN COALESCE(v_docs, '[]'::jsonb);
END;
$$;

-- 22. Get Student medical logs
CREATE OR REPLACE FUNCTION public.fn_get_student_medical(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_med JSONB;
BEGIN
    SELECT jsonb_build_object(
        'blood_group', blood_group,
        'allergies', allergies,
        'conditions', medical_conditions,
        'notes', emergency_notes
    ) INTO v_med
    FROM public.student_medical_profiles
    WHERE student_profile_id = p_student_id
      AND deleted_at IS NULL;
    RETURN COALESCE(v_med, '{}'::jsonb);
END;
$$;

-- 23. Get Staff qualifications list
CREATE OR REPLACE FUNCTION public.fn_get_staff_qualification(p_staff_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_quals JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'degree', degree,
        'institution', institution,
        'year', year_completed
    )) INTO v_quals
    FROM public.staff_qualifications
    WHERE staff_profile_id = p_staff_id
      AND deleted_at IS NULL;
    RETURN COALESCE(v_quals, '[]'::jsonb);
END;
$$;

-- 24. Get Student identifiers list
CREATE OR REPLACE FUNCTION public.fn_get_student_identifiers(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_ids JSONB;
BEGIN
    SELECT jsonb_object_agg(identifier_type, identifier_value) INTO v_ids
    FROM public.person_identifiers
    WHERE student_profile_id = p_student_id
      AND deleted_at IS NULL
      AND is_active = true;
    RETURN COALESCE(v_ids, '{}'::jsonb);
END;
$$;

-- 25. Core profile completion calculator
CREATE OR REPLACE FUNCTION public.fn_profile_completion(p_student_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_completion NUMERIC := 0.00;
    v_has_parents BOOLEAN;
    v_has_emergency BOOLEAN;
    v_has_medical BOOLEAN;
    v_has_doc BOOLEAN;
BEGIN
    -- Base profile exists = 40%
    IF EXISTS(SELECT 1 FROM public.student_profiles WHERE user_id = p_student_id) THEN
        v_completion := v_completion + 40.00;
    ELSE
        RETURN 0.00;
    END IF;

    -- Parents registered = +20%
    SELECT EXISTS(SELECT 1 FROM public.student_parents WHERE student_profile_id = p_student_id) INTO v_has_parents;
    IF v_has_parents THEN
        v_completion := v_completion + 20.00;
    END IF;

    -- Emergency contacts mapped = +10%
    SELECT EXISTS(SELECT 1 FROM public.emergency_contacts WHERE student_profile_id = p_student_id AND deleted_at IS NULL) INTO v_has_emergency;
    IF v_has_emergency THEN
        v_completion := v_completion + 10.00;
    END IF;

    -- Medical details recorded = +15%
    SELECT EXISTS(SELECT 1 FROM public.student_medical_profiles WHERE student_profile_id = p_student_id AND deleted_at IS NULL) INTO v_has_medical;
    IF v_has_medical THEN
        v_completion := v_completion + 15.00;
    END IF;

    -- Documents uploaded = +15%
    SELECT EXISTS(SELECT 1 FROM public.student_documents WHERE student_profile_id = p_student_id AND deleted_at IS NULL) INTO v_has_doc;
    IF v_has_doc THEN
        v_completion := v_completion + 15.00;
    END IF;

    RETURN v_completion;
END;
$$;
