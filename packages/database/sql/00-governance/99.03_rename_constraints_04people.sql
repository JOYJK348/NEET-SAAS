-- =============================================================================
-- Constraint Rename Script — Phase 3: 04-people
-- =============================================================================

-- 04.01 staff_profiles
ALTER INDEX staff_profiles_pkey RENAME TO pk_staff_profiles;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT fk_staff_user TO fk_staff_profiles_users;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT fk_staff_tenant TO fk_staff_profiles_institutes;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT fk_staff_designation TO fk_staff_profiles_designations;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT fk_staff_created_by TO fk_staff_profiles_users_created_by;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT fk_staff_updated_by TO fk_staff_profiles_users_updated_by;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT fk_staff_deleted_by TO fk_staff_profiles_users_deleted_by;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT chk_staff_employee_code TO chk_staff_profiles_employee_code;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT chk_staff_resignation TO chk_staff_profiles_resignation_dates;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT chk_staff_status_dates TO chk_staff_profiles_status_dates;
ALTER TABLE public.staff_profiles RENAME CONSTRAINT chk_staff_version TO chk_staff_profiles_version;
ALTER INDEX idx_staff_tenant_status RENAME TO idx_staff_profiles_tenant_status;
ALTER INDEX idx_staff_designation RENAME TO idx_staff_profiles_designation;
ALTER INDEX idx_staff_joined RENAME TO idx_staff_profiles_joined;
ALTER INDEX uq_part_staff_tenant_code RENAME TO idx_uq_staff_profiles_tenant_employee_code;

-- 04.02 student_profiles
ALTER INDEX student_profiles_pkey RENAME TO pk_student_profiles;
ALTER TABLE public.student_profiles RENAME CONSTRAINT fk_students_user TO fk_student_profiles_users;
ALTER TABLE public.student_profiles RENAME CONSTRAINT fk_students_tenant TO fk_student_profiles_institutes;
ALTER TABLE public.student_profiles RENAME CONSTRAINT fk_students_created_by TO fk_student_profiles_users_created_by;
ALTER TABLE public.student_profiles RENAME CONSTRAINT fk_students_updated_by TO fk_student_profiles_users_updated_by;
ALTER TABLE public.student_profiles RENAME CONSTRAINT fk_students_deleted_by TO fk_student_profiles_users_deleted_by;
ALTER TABLE public.student_profiles RENAME CONSTRAINT chk_students_code TO chk_student_profiles_student_code;
ALTER TABLE public.student_profiles RENAME CONSTRAINT chk_students_dob TO chk_student_profiles_date_of_birth;
ALTER TABLE public.student_profiles RENAME CONSTRAINT chk_students_version TO chk_student_profiles_version;
ALTER INDEX idx_students_tenant_status RENAME TO idx_student_profiles_tenant_status;
ALTER INDEX idx_students_dob RENAME TO idx_student_profiles_dob;
ALTER INDEX idx_students_admitted RENAME TO idx_student_profiles_admitted;
ALTER INDEX uq_part_students_tenant_code RENAME TO idx_uq_student_profiles_tenant_student_code;

-- 04.03 parent_profiles
ALTER INDEX parent_profiles_pkey RENAME TO pk_parent_profiles;
ALTER TABLE public.parent_profiles RENAME CONSTRAINT fk_parents_user TO fk_parent_profiles_users;
ALTER TABLE public.parent_profiles RENAME CONSTRAINT fk_parents_tenant TO fk_parent_profiles_institutes;
ALTER TABLE public.parent_profiles RENAME CONSTRAINT fk_parents_created_by TO fk_parent_profiles_users_created_by;
ALTER TABLE public.parent_profiles RENAME CONSTRAINT fk_parents_updated_by TO fk_parent_profiles_users_updated_by;
ALTER TABLE public.parent_profiles RENAME CONSTRAINT fk_parents_deleted_by TO fk_parent_profiles_users_deleted_by;
ALTER TABLE public.parent_profiles RENAME CONSTRAINT chk_parents_version TO chk_parent_profiles_version;
ALTER INDEX idx_parents_tenant RENAME TO idx_parent_profiles_tenant;

-- 04.04 student_parents
ALTER INDEX student_parents_pkey RENAME TO pk_student_parents;
ALTER TABLE public.student_parents RENAME CONSTRAINT fk_sp_student TO fk_student_parents_student_profiles;
ALTER TABLE public.student_parents RENAME CONSTRAINT fk_sp_parent TO fk_student_parents_parent_profiles;
ALTER TABLE public.student_parents RENAME CONSTRAINT fk_sp_tenant TO fk_student_parents_institutes;
ALTER TABLE public.student_parents RENAME CONSTRAINT fk_sp_created_by TO fk_student_parents_users;
ALTER INDEX idx_sp_parent_lookup RENAME TO idx_student_parents_parent;
ALTER INDEX idx_sp_tenant_lookup RENAME TO idx_student_parents_tenant;
ALTER INDEX uq_part_sp_primary_guardian RENAME TO idx_uq_student_parents_primary_guardian;

-- 04.05 student_admissions
ALTER INDEX student_admissions_pkey RENAME TO pk_student_admissions;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_tenant TO fk_student_admissions_institutes;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_student TO fk_student_admissions_student_profiles;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_academic_year TO fk_student_admissions_academic_years;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_course TO fk_student_admissions_courses;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_branch TO fk_student_admissions_branches;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_created_by TO fk_student_admissions_users_created_by;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_updated_by TO fk_student_admissions_users_updated_by;
ALTER TABLE public.student_admissions RENAME CONSTRAINT fk_sa_deleted_by TO fk_student_admissions_users_deleted_by;
ALTER TABLE public.student_admissions RENAME CONSTRAINT uq_sa_tenant_id TO uq_student_admissions_tenant_id;
ALTER TABLE public.student_admissions RENAME CONSTRAINT chk_sa_admission_number TO chk_student_admissions_admission_number;
ALTER TABLE public.student_admissions RENAME CONSTRAINT chk_sa_admission_date TO chk_student_admissions_admission_date;
ALTER TABLE public.student_admissions RENAME CONSTRAINT chk_sa_version TO chk_student_admissions_version;
ALTER TABLE public.student_admissions RENAME CONSTRAINT uq_sa_admission_number TO uq_student_admissions_admission_number;
ALTER INDEX idx_sa_tenant_student RENAME TO idx_student_admissions_tenant_student;
ALTER INDEX idx_sa_tenant_course RENAME TO idx_student_admissions_tenant_course;
ALTER INDEX idx_sa_tenant_academic_year RENAME TO idx_student_admissions_tenant_academic_year;
ALTER INDEX idx_sa_tenant_branch RENAME TO idx_student_admissions_tenant_branch;
ALTER INDEX idx_sa_status RENAME TO idx_student_admissions_status;

-- 04.06 student_batch_enrollments
ALTER INDEX student_batch_enrollments_pkey RENAME TO pk_student_batch_enrollments;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT fk_sbe_admission TO fk_student_batch_enrollments_student_admissions;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT fk_sbe_batch TO fk_student_batch_enrollments_batches;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT fk_sbe_tenant TO fk_student_batch_enrollments_institutes;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT fk_sbe_created_by TO fk_student_batch_enrollments_users_created_by;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT fk_sbe_updated_by TO fk_student_batch_enrollments_users_updated_by;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT fk_sbe_deleted_by TO fk_student_batch_enrollments_users_deleted_by;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT chk_sbe_duration TO chk_student_batch_enrollments_duration;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT chk_sbe_version TO chk_student_batch_enrollments_version;
ALTER TABLE public.student_batch_enrollments RENAME CONSTRAINT uq_sbe_tenant_id TO uq_student_batch_enrollments_tenant_id;
ALTER INDEX idx_sbe_admission_lookup RENAME TO idx_student_batch_enrollments_admission;
ALTER INDEX idx_sbe_batch_lookup RENAME TO idx_student_batch_enrollments_batch;
ALTER INDEX idx_sbe_tenant_lookup RENAME TO idx_student_batch_enrollments_tenant;
ALTER INDEX uq_part_sbe_primary_active RENAME TO idx_uq_student_batch_enrollments_primary_active;

-- 04.07 staff_departments
ALTER INDEX staff_departments_pkey RENAME TO pk_staff_departments;
ALTER TABLE public.staff_departments RENAME CONSTRAINT fk_sd_staff TO fk_staff_departments_staff_profiles;
ALTER TABLE public.staff_departments RENAME CONSTRAINT fk_sd_branch_dept TO fk_staff_departments_branch_departments;
ALTER TABLE public.staff_departments RENAME CONSTRAINT fk_sd_tenant TO fk_staff_departments_institutes;
ALTER TABLE public.staff_departments RENAME CONSTRAINT fk_sd_created_by TO fk_staff_departments_users_created_by;
ALTER TABLE public.staff_departments RENAME CONSTRAINT fk_sd_updated_by TO fk_staff_departments_users_updated_by;
ALTER TABLE public.staff_departments RENAME CONSTRAINT fk_sd_deleted_by TO fk_staff_departments_users_deleted_by;
ALTER TABLE public.staff_departments RENAME CONSTRAINT chk_sd_version TO chk_staff_departments_version;
ALTER INDEX idx_sd_staff_lookup RENAME TO idx_staff_departments_staff;
ALTER INDEX idx_sd_dept_lookup RENAME TO idx_staff_departments_dept;
ALTER INDEX uq_part_sd_primary_active RENAME TO idx_uq_staff_departments_primary_active;

-- 04.08 staff_subjects
ALTER INDEX staff_subjects_pkey RENAME TO pk_staff_subjects;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT fk_ss_staff TO fk_staff_subjects_staff_profiles;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT fk_ss_subject TO fk_staff_subjects_subjects;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT fk_ss_tenant TO fk_staff_subjects_institutes;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT fk_ss_created_by TO fk_staff_subjects_users_created_by;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT fk_ss_updated_by TO fk_staff_subjects_users_updated_by;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT fk_ss_deleted_by TO fk_staff_subjects_users_deleted_by;
ALTER TABLE public.staff_subjects RENAME CONSTRAINT chk_ss_version TO chk_staff_subjects_version;
ALTER INDEX idx_ss_staff_lookup RENAME TO idx_staff_subjects_staff;
ALTER INDEX idx_ss_subject_lookup RENAME TO idx_staff_subjects_subject;

-- 04.09 student_documents
ALTER INDEX student_documents_pkey RENAME TO pk_student_documents;
ALTER TABLE public.student_documents RENAME CONSTRAINT fk_sd_student TO fk_student_documents_student_profiles;
ALTER TABLE public.student_documents RENAME CONSTRAINT fk_sd_tenant TO fk_student_documents_institutes;
ALTER TABLE public.student_documents RENAME CONSTRAINT fk_sd_verified_by TO fk_student_documents_users_verified_by;
ALTER TABLE public.student_documents RENAME CONSTRAINT fk_sd_created_by TO fk_student_documents_users_created_by;
ALTER TABLE public.student_documents RENAME CONSTRAINT fk_sd_updated_by TO fk_student_documents_users_updated_by;
ALTER TABLE public.student_documents RENAME CONSTRAINT fk_sd_deleted_by TO fk_student_documents_users_deleted_by;
ALTER TABLE public.student_documents RENAME CONSTRAINT chk_sd_verified TO chk_student_documents_verified;
ALTER TABLE public.student_documents RENAME CONSTRAINT chk_sd_version TO chk_student_documents_version;
ALTER INDEX idx_sd_student_lookup RENAME TO idx_student_documents_student;
ALTER INDEX idx_sd_tenant_lookup RENAME TO idx_student_documents_tenant;

-- 04.10 guardian_contacts
ALTER INDEX guardian_contacts_pkey RENAME TO pk_guardian_contacts;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT fk_gc_student TO fk_guardian_contacts_student_profiles;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT fk_gc_tenant TO fk_guardian_contacts_institutes;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT fk_gc_created_by TO fk_guardian_contacts_users_created_by;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT fk_gc_updated_by TO fk_guardian_contacts_users_updated_by;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT fk_gc_deleted_by TO fk_guardian_contacts_users_deleted_by;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT chk_gc_name TO chk_guardian_contacts_name;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT chk_gc_relationship TO chk_guardian_contacts_relationship;
ALTER TABLE public.guardian_contacts RENAME CONSTRAINT chk_gc_version TO chk_guardian_contacts_version;
ALTER INDEX idx_gc_student_lookup RENAME TO idx_guardian_contacts_student;
ALTER INDEX idx_gc_tenant_lookup RENAME TO idx_guardian_contacts_tenant;

-- 04.11 staff_employment_history
ALTER INDEX staff_employment_history_pkey RENAME TO pk_staff_employment_history;
ALTER TABLE public.staff_employment_history RENAME CONSTRAINT fk_seh_staff TO fk_staff_employment_history_staff_profiles;
ALTER TABLE public.staff_employment_history RENAME CONSTRAINT fk_seh_tenant TO fk_staff_employment_history_institutes;
ALTER TABLE public.staff_employment_history RENAME CONSTRAINT fk_seh_designation TO fk_staff_employment_history_designations;
ALTER TABLE public.staff_employment_history RENAME CONSTRAINT fk_seh_department TO fk_staff_employment_history_departments;
ALTER TABLE public.staff_employment_history RENAME CONSTRAINT fk_seh_created_by TO fk_staff_employment_history_users;
ALTER TABLE public.staff_employment_history RENAME CONSTRAINT chk_seh_reason TO chk_staff_employment_history_reason;
ALTER INDEX idx_seh_staff_lookup RENAME TO idx_staff_employment_history_staff;
ALTER INDEX idx_seh_tenant_lookup RENAME TO idx_staff_employment_history_tenant;
