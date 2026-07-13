-- =============================================================================
-- Constraint Rename Script — Phase 1: 01-master
-- Run in Supabase SQL Editor after all tables exist.
-- =============================================================================

-- 01.01 institutes
ALTER INDEX institutes_pkey RENAME TO pk_institutes;

-- 01.02 branches
ALTER INDEX branches_pkey RENAME TO pk_branches;
ALTER TABLE public.branches RENAME CONSTRAINT fk_branches_tenant TO fk_branches_institutes;
ALTER TABLE public.branches RENAME CONSTRAINT chk_branches_display_name_length TO chk_branches_display_name;
ALTER INDEX uq_part_branches_tenant_code RENAME TO idx_uq_branches_tenant_code;
ALTER INDEX uq_part_branches_tenant_slug RENAME TO idx_uq_branches_tenant_slug;
ALTER INDEX uq_part_branches_tenant_email RENAME TO idx_uq_branches_tenant_email;

-- 01.03 academic_years
ALTER INDEX academic_years_pkey RENAME TO pk_academic_years;
ALTER TABLE public.academic_years RENAME CONSTRAINT fk_academic_years_tenant TO fk_academic_years_institutes;
ALTER TABLE public.academic_years RENAME CONSTRAINT chk_academic_years_current_active TO chk_academic_years_is_current;
ALTER TABLE public.academic_years RENAME CONSTRAINT excl_academic_years_overlap TO excl_academic_years_date_overlap;
ALTER INDEX uq_part_ay_tenant_code RENAME TO idx_uq_academic_years_tenant_code;
ALTER INDEX uq_part_ay_tenant_name RENAME TO idx_uq_academic_years_tenant_name;
ALTER INDEX uq_part_ay_tenant_current RENAME TO idx_uq_academic_years_tenant_current;

-- 01.04 departments
ALTER INDEX departments_pkey RENAME TO pk_departments;
ALTER TABLE public.departments RENAME CONSTRAINT fk_departments_tenant TO fk_departments_institutes;
ALTER INDEX uq_part_departments_tenant_code RENAME TO idx_uq_departments_tenant_code;
ALTER INDEX uq_part_departments_tenant_name_lower RENAME TO idx_uq_departments_tenant_name_lower;

-- 01.05 branch_departments
ALTER INDEX branch_departments_pkey RENAME TO pk_branch_departments;
ALTER TABLE public.branch_departments RENAME CONSTRAINT fk_bd_tenant TO fk_branch_departments_institutes;
ALTER TABLE public.branch_departments RENAME CONSTRAINT fk_bd_branch_tenant TO fk_branch_departments_branches;
ALTER TABLE public.branch_departments RENAME CONSTRAINT fk_bd_department_tenant TO fk_branch_departments_departments;
ALTER TABLE public.branch_departments RENAME CONSTRAINT chk_bd_display_order TO chk_branch_departments_display_order;
ALTER TABLE public.branch_departments RENAME CONSTRAINT chk_bd_version TO chk_branch_departments_version;
ALTER INDEX idx_bd_tenant_id RENAME TO idx_branch_departments_tenant_id;
ALTER INDEX idx_bd_tenant_branch_active RENAME TO idx_branch_departments_tenant_branch_active;
ALTER INDEX idx_bd_tenant_branch_display RENAME TO idx_branch_departments_tenant_branch_display;
ALTER INDEX idx_bd_tenant_dept_lookup RENAME TO idx_branch_departments_tenant_dept_lookup;
ALTER INDEX uq_part_bd_branch_dept RENAME TO idx_uq_branch_departments_branch_dept;

-- 01.06 designations
ALTER INDEX designations_pkey RENAME TO pk_designations;
ALTER TABLE public.designations RENAME CONSTRAINT fk_designations_tenant TO fk_designations_institutes;
ALTER INDEX uq_part_designations_tenant_code RENAME TO idx_uq_designations_tenant_code;
ALTER INDEX uq_part_designations_tenant_name_lower RENAME TO idx_uq_designations_tenant_name_lower;

-- 01.07 courses
ALTER INDEX courses_pkey RENAME TO pk_courses;
ALTER TABLE public.courses RENAME CONSTRAINT fk_courses_tenant TO fk_courses_institutes;
ALTER INDEX uq_part_courses_tenant_code RENAME TO idx_uq_courses_tenant_code;
ALTER INDEX uq_part_courses_tenant_name_lower RENAME TO idx_uq_courses_tenant_name_lower;

-- 01.08 subjects
ALTER INDEX subjects_pkey RENAME TO pk_subjects;
ALTER TABLE public.subjects RENAME CONSTRAINT fk_subjects_tenant TO fk_subjects_institutes;
ALTER INDEX uq_part_subjects_tenant_code RENAME TO idx_uq_subjects_tenant_code;
ALTER INDEX uq_part_subjects_tenant_name_lower RENAME TO idx_uq_subjects_tenant_name_lower;

-- 01.09 course_subjects
ALTER INDEX course_subjects_pkey RENAME TO pk_course_subjects;
ALTER TABLE public.course_subjects RENAME CONSTRAINT fk_cs_tenant TO fk_course_subjects_institutes;
ALTER TABLE public.course_subjects RENAME CONSTRAINT fk_cs_course_tenant TO fk_course_subjects_courses;
ALTER TABLE public.course_subjects RENAME CONSTRAINT fk_cs_subject_tenant TO fk_course_subjects_subjects;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_display_order TO chk_course_subjects_display_order;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_total_marks TO chk_course_subjects_total_marks;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_passing_marks TO chk_course_subjects_passing_marks;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_passing_limit TO chk_course_subjects_passing_marks_limit;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_credits TO chk_course_subjects_credits;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_planned_hours TO chk_course_subjects_planned_hours;
ALTER TABLE public.course_subjects RENAME CONSTRAINT chk_cs_version TO chk_course_subjects_version;
ALTER INDEX idx_cs_tenant_course_active RENAME TO idx_course_subjects_tenant_course_active;
ALTER INDEX idx_cs_tenant_course_display RENAME TO idx_course_subjects_tenant_course_display;
ALTER INDEX idx_cs_tenant_subject_lookup RENAME TO idx_course_subjects_tenant_subject_lookup;
ALTER INDEX uq_part_cs_tenant_course_subject RENAME TO idx_uq_course_subjects_tenant_course_subject;

-- 01.10 chapters
ALTER INDEX chapters_pkey RENAME TO pk_chapters;
ALTER TABLE public.chapters RENAME CONSTRAINT fk_chapters_tenant TO fk_chapters_institutes;
ALTER TABLE public.chapters RENAME CONSTRAINT fk_chapters_course_subject_tenant TO fk_chapters_course_subjects;
ALTER INDEX uq_part_chapters_tenant_cs_code RENAME TO idx_uq_chapters_tenant_cs_code;
ALTER INDEX uq_part_chapters_tenant_cs_name_lower RENAME TO idx_uq_chapters_tenant_cs_name_lower;
ALTER INDEX uq_part_chapters_tenant_cs_short_name_lower RENAME TO idx_uq_chapters_tenant_cs_short_name_lower;

-- 01.11 topics
ALTER INDEX topics_pkey RENAME TO pk_topics;
ALTER TABLE public.topics RENAME CONSTRAINT fk_topics_tenant TO fk_topics_institutes;
ALTER TABLE public.topics RENAME CONSTRAINT fk_topics_chapter_tenant TO fk_topics_chapters;
ALTER TABLE public.topics RENAME CONSTRAINT chk_topics_difficulty TO chk_topics_difficulty_level;
ALTER INDEX uq_part_topics_tenant_ch_code RENAME TO idx_uq_topics_tenant_ch_code;
ALTER INDEX uq_part_topics_tenant_ch_name_lower RENAME TO idx_uq_topics_tenant_ch_name_lower;
ALTER INDEX uq_part_topics_tenant_ch_short_name_lower RENAME TO idx_uq_topics_tenant_ch_short_name_lower;

-- 01.12 batch_delivery_types
ALTER INDEX batch_delivery_types_pkey RENAME TO pk_batch_delivery_types;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT fk_bdt_tenant TO fk_batch_delivery_types_institutes;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_name_length TO chk_batch_delivery_types_name;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_code_format TO chk_batch_delivery_types_code;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_description TO chk_batch_delivery_types_description;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_icon TO chk_batch_delivery_types_icon;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_max_students TO chk_batch_delivery_types_max_students;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_times TO chk_batch_delivery_types_time_slots;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_display_order TO chk_batch_delivery_types_display_order;
ALTER TABLE public.batch_delivery_types RENAME CONSTRAINT chk_bdt_version TO chk_batch_delivery_types_version;
ALTER INDEX idx_bdt_tenant_active RENAME TO idx_batch_delivery_types_tenant_active;
ALTER INDEX idx_bdt_tenant_display RENAME TO idx_batch_delivery_types_tenant_display;
ALTER INDEX idx_bdt_tenant_search_name RENAME TO idx_batch_delivery_types_tenant_search_name;
ALTER INDEX uq_part_bdt_tenant_code RENAME TO idx_uq_batch_delivery_types_tenant_code;
ALTER INDEX uq_part_bdt_tenant_name_lower RENAME TO idx_uq_batch_delivery_types_tenant_name_lower;
ALTER INDEX uq_part_bdt_tenant_default RENAME TO idx_uq_batch_delivery_types_tenant_default;

-- 01.13 batches
ALTER INDEX batches_pkey RENAME TO pk_batches;
ALTER TABLE public.batches RENAME CONSTRAINT fk_batches_tenant TO fk_batches_institutes;
ALTER TABLE public.batches RENAME CONSTRAINT fk_batches_branch_tenant TO fk_batches_branches;
ALTER TABLE public.batches RENAME CONSTRAINT fk_batches_course_tenant TO fk_batches_courses;
ALTER TABLE public.batches RENAME CONSTRAINT fk_batches_academic_year_tenant TO fk_batches_academic_years;
ALTER TABLE public.batches RENAME CONSTRAINT fk_batches_delivery_type_tenant TO fk_batches_batch_delivery_types;
ALTER INDEX uq_part_batches_tenant_code RENAME TO idx_uq_batches_tenant_code;
ALTER INDEX uq_part_batches_tenant_name_lower RENAME TO idx_uq_batches_tenant_name_lower;
