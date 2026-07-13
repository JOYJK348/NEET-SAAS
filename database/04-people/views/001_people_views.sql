-- ============================================================================
-- SQL File: 001_people_views.sql
-- Domain: Student and Staff Dynamic Views Layer
-- ============================================================================

SET search_path = public;

-- 1. Student Directory View
CREATE OR REPLACE VIEW public.v_student_directory AS
SELECT 
    sp.user_id AS student_id,
    sp.tenant_id,
    sp.student_code,
    concat_ws(' ', u.first_name, u.last_name) AS student_name,
    u.email,
    NULL::VARCHAR AS phone,
    sp.academic_status,
    b.name AS batch_name,
    b.id AS batch_id
FROM public.student_profiles sp
JOIN public.users u ON u.id = sp.user_id AND u.deleted_at IS NULL
LEFT JOIN public.student_admissions sa ON sa.student_profile_id = sp.user_id AND sa.deleted_at IS NULL
LEFT JOIN public.student_batch_enrollments sbe ON sbe.student_admission_id = sa.id AND sbe.status = 'ACTIVE' AND sbe.deleted_at IS NULL
LEFT JOIN public.batches b ON b.id = sbe.batch_id
WHERE sp.deleted_at IS NULL;

-- 2. Student Profile Detailed View
CREATE OR REPLACE VIEW public.v_student_profile AS
SELECT 
    sp.user_id AS student_id,
    sp.tenant_id,
    sp.student_code,
    u.first_name,
    u.last_name,
    u.email,
    NULL::VARCHAR AS phone,
    sp.date_of_birth,
    sp.gender,
    sp.blood_group,
    sp.academic_status,
    sp.admitted_at,
    sp.profile_completion_percentage
FROM public.student_profiles sp
JOIN public.users u ON u.id = sp.user_id AND u.deleted_at IS NULL
WHERE sp.deleted_at IS NULL;

-- 3. Parent Directory View
CREATE OR REPLACE VIEW public.v_parent_directory AS
SELECT 
    pp.user_id AS parent_id,
    pp.tenant_id,
    concat_ws(' ', u.first_name, u.last_name) AS parent_name,
    u.email,
    NULL::VARCHAR AS phone,
    count(sp.student_profile_id) AS associated_students_count
FROM public.parent_profiles pp
JOIN public.users u ON u.id = pp.user_id AND u.deleted_at IS NULL
LEFT JOIN public.student_parents sp ON sp.parent_profile_id = pp.user_id
WHERE pp.deleted_at IS NULL
GROUP BY pp.user_id, pp.tenant_id, u.first_name, u.last_name, u.email;

-- 4. Staff Directory View
CREATE OR REPLACE VIEW public.v_staff_directory AS
SELECT 
    sf.user_id AS staff_id,
    sf.tenant_id,
    sf.employee_code,
    concat_ws(' ', u.first_name, u.last_name) AS staff_name,
    u.email,
    NULL::VARCHAR AS phone,
    des.name AS designation,
    d.name AS department_name
FROM public.staff_profiles sf
JOIN public.users u ON u.id = sf.user_id AND u.deleted_at IS NULL
LEFT JOIN public.designations des ON des.id = sf.designation_id
LEFT JOIN public.staff_departments sd ON sd.staff_profile_id = sf.user_id AND sd.is_active = true AND sd.deleted_at IS NULL
LEFT JOIN public.departments d ON d.id = sd.department_id
WHERE sf.deleted_at IS NULL;

-- 5. Faculty Batch Assignments View
CREATE OR REPLACE VIEW public.v_faculty_assignments AS
SELECT 
    sba.id AS assignment_id,
    sba.tenant_id,
    sba.staff_profile_id AS faculty_id,
    concat_ws(' ', u.first_name, u.last_name) AS faculty_name,
    b.name AS batch_name,
    sub.name AS subject_name,
    sba.effective_from,
    sba.effective_to,
    sba.is_active
FROM public.staff_batch_assignments sba
JOIN public.users u ON u.id = sba.staff_profile_id AND u.deleted_at IS NULL
JOIN public.batches b ON b.id = sba.batch_id
JOIN public.subjects sub ON sub.id = sba.subject_id
WHERE sba.deleted_at IS NULL;

-- 6. Student Current Batch Mapping View
CREATE OR REPLACE VIEW public.v_student_current_batch AS
SELECT 
    sa.student_profile_id,
    sbe.tenant_id,
    sbe.batch_id,
    b.name AS batch_name,
    sbe.status,
    sbe.joined_at AS effective_from
FROM public.student_batch_enrollments sbe
JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
JOIN public.batches b ON b.id = sbe.batch_id
WHERE sbe.deleted_at IS NULL;

-- 7. Student Academic Summary View
CREATE OR REPLACE VIEW public.v_student_academic_summary AS
SELECT 
    sa.student_profile_id,
    sa.tenant_id,
    sa.admission_number,
    sa.admission_status,
    ay.name AS academic_year_name,
    c.name AS course_name
FROM public.student_admissions sa
JOIN public.academic_years ay ON ay.id = sa.academic_year_id
JOIN public.courses c ON c.id = sa.course_id
WHERE sa.deleted_at IS NULL;

-- 8. Student Document Outbox View
CREATE OR REPLACE VIEW public.v_student_documents AS
SELECT 
    sd.id AS document_id,
    sd.tenant_id,
    sd.student_profile_id,
    sd.document_type_id,
    sd.status,
    sd.storage_key,
    sd.expiry_date
FROM public.student_documents sd
WHERE sd.deleted_at IS NULL;

-- 9. Batch Strength Summary View
CREATE OR REPLACE VIEW public.v_batch_strength AS
SELECT 
    b.id AS batch_id,
    b.tenant_id,
    b.name AS batch_name,
    count(sa.student_profile_id) AS active_students_count
FROM public.batches b
LEFT JOIN public.student_batch_enrollments sbe ON sbe.batch_id = b.id AND sbe.status = 'ACTIVE' AND sbe.deleted_at IS NULL
LEFT JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.tenant_id, b.name;

-- 10. Staff Workload View
CREATE OR REPLACE VIEW public.v_staff_workload AS
SELECT 
    sf.user_id AS staff_id,
    sf.tenant_id,
    concat_ws(' ', u.first_name, u.last_name) AS staff_name,
    count(DISTINCT sba.batch_id) AS total_assigned_batches,
    count(DISTINCT sba.subject_id) AS total_assigned_subjects
FROM public.staff_profiles sf
JOIN public.users u ON u.id = sf.user_id AND u.deleted_at IS NULL
LEFT JOIN public.staff_batch_assignments sba ON sba.staff_profile_id = sf.user_id AND sba.is_active = true AND sba.deleted_at IS NULL
WHERE sf.deleted_at IS NULL
GROUP BY sf.user_id, sf.tenant_id, u.first_name, u.last_name;

-- 11. Student Contacts View
CREATE OR REPLACE VIEW public.v_student_contacts AS
SELECT 
    sp.user_id AS student_id,
    sp.tenant_id,
    u.email AS student_email,
    NULL::VARCHAR AS student_phone,
    ec.name AS primary_emergency_contact_name,
    ec.phone AS primary_emergency_contact_phone
FROM public.student_profiles sp
JOIN public.users u ON u.id = sp.user_id AND u.deleted_at IS NULL
LEFT JOIN public.emergency_contacts ec ON ec.student_profile_id = sp.user_id AND ec.is_primary = true AND ec.deleted_at IS NULL
WHERE sp.deleted_at IS NULL;

-- 12. Student Dashboard Statistics View
CREATE OR REPLACE VIEW public.v_student_dashboard AS
SELECT 
    tenant_id,
    academic_status,
    count(1) AS total_count
FROM public.student_profiles
WHERE deleted_at IS NULL
GROUP BY tenant_id, academic_status;

-- 13. Parent Directory Summary View
CREATE OR REPLACE VIEW public.v_parent_summary AS
SELECT 
    pp.user_id AS parent_id,
    pp.tenant_id,
    concat_ws(' ', u.first_name, u.last_name) AS parent_name,
    pp.occupation,
    pp.education_level AS education
FROM public.parent_profiles pp
JOIN public.users u ON u.id = pp.user_id AND u.deleted_at IS NULL
WHERE pp.deleted_at IS NULL;

-- 14. Student Complete Profile JSON Aggregation View (For single query lookup APIs)
CREATE OR REPLACE VIEW public.v_student_complete_profile AS
SELECT 
    sp.user_id AS student_id,
    sp.tenant_id,
    sp.student_code,
    sp.profile_completion_percentage,
    jsonb_build_object(
        'profile', fn_get_student_full_profile(sp.user_id),
        'parents', fn_get_student_parents(sp.user_id),
        'current_batch', fn_get_student_current_batch(sp.user_id),
        'academic_year', fn_get_student_current_academic_year(sp.user_id),
        'medical', fn_get_student_medical(sp.user_id),
        'documents', fn_get_student_documents(sp.user_id),
        'emergency_contacts', fn_get_student_guardians(sp.user_id),
        'identifiers', fn_get_student_identifiers(sp.user_id)
    ) AS complete_profile
FROM public.student_profiles sp
WHERE sp.deleted_at IS NULL;

-- 15. Student Profile Completion Details View (For CRM dashboard metrics)
CREATE OR REPLACE VIEW public.v_student_profile_completion AS
SELECT 
    sp.user_id AS student_id,
    sp.tenant_id,
    sp.student_code,
    sp.profile_completion_percentage,
    EXISTS(SELECT 1 FROM public.student_documents WHERE student_profile_id = sp.user_id AND deleted_at IS NULL) AS has_documents,
    EXISTS(SELECT 1 FROM public.student_medical_profiles WHERE student_profile_id = sp.user_id AND deleted_at IS NULL) AS has_medical,
    EXISTS(SELECT 1 FROM public.student_parents WHERE student_profile_id = sp.user_id) AS has_parents,
    EXISTS(SELECT 1 FROM public.emergency_contacts WHERE student_profile_id = sp.user_id AND deleted_at IS NULL) AS has_emergency,
    EXISTS(
        SELECT 1 
        FROM public.student_batch_enrollments sbe 
        JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
        WHERE sa.student_profile_id = sp.user_id AND sbe.status = 'ACTIVE' AND sbe.deleted_at IS NULL
    ) AS has_active_batch
FROM public.student_profiles sp
WHERE sp.deleted_at IS NULL;

-- 16. Student Milestone Chronological History View
CREATE OR REPLACE VIEW public.v_student_timeline AS
SELECT 
    student_profile_id,
    tenant_id,
    'ADMISSION'::VARCHAR AS event_type,
    created_at AS event_time,
    'Student admissions record initialized'::TEXT AS event_details
FROM public.student_admissions WHERE deleted_at IS NULL
UNION ALL
SELECT 
    student_profile_id,
    tenant_id,
    'DOCUMENT_UPLOAD'::VARCHAR AS event_type,
    created_at AS event_time,
    concat_ws(' ', 'Uploaded verification document type:', document_type_id) AS event_details
FROM public.student_documents WHERE deleted_at IS NULL
UNION ALL
SELECT 
    student_profile_id,
    tenant_id,
    'PARENT_MAPPED'::VARCHAR AS event_type,
    created_at AS event_time,
    'Parent profile mapped to student account'::TEXT AS event_details
FROM public.student_parents
UNION ALL
SELECT 
    student_profile_id,
    tenant_id,
    'MEDICAL_LOGGED'::VARCHAR AS event_type,
    created_at AS event_time,
    'Medical health summary profile saved'::TEXT AS event_details
FROM public.student_medical_profiles WHERE deleted_at IS NULL
UNION ALL
SELECT 
    sa.student_profile_id,
    sbe.tenant_id,
    'BATCH_ENROLLED'::VARCHAR AS event_type,
    sbe.created_at AS event_time,
    'Assigned to active classroom batch enrollment'::TEXT AS event_details
FROM public.student_batch_enrollments sbe
JOIN public.student_admissions sa ON sa.id = sbe.student_admission_id AND sa.deleted_at IS NULL
WHERE sbe.deleted_at IS NULL
UNION ALL
SELECT 
    student_profile_id,
    tenant_id,
    'STATUS_TRANSITION'::VARCHAR AS event_type,
    changed_at AS event_time,
    concat_ws(' ', 'Lifecycle status transitioned from', from_status, 'to', to_status, '. Reason:', reason) AS event_details
FROM public.student_status_history WHERE deleted_at IS NULL;
