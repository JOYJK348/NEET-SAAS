-- =============================================================================
-- Constraint Rename Script — Phase 5: 06-examinations
-- =============================================================================

-- 06.01 exams
ALTER TABLE public.exams RENAME CONSTRAINT exams_pkey TO pk_exams;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_tenant TO fk_exams_institutes;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_course TO fk_exams_courses;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_batch TO fk_exams_batches;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_subject TO fk_exams_subjects;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_question_paper TO fk_exams_question_papers;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_academic_year TO fk_exams_academic_years;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_published_by TO fk_exams_users_published_by;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_results_published_by TO fk_exams_users_results_published_by;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_created_by TO fk_exams_users_created_by;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_updated_by TO fk_exams_users_updated_by;
ALTER TABLE public.exams RENAME CONSTRAINT fk_exams_deleted_by TO fk_exams_users_deleted_by;
-- uq_exams_tenant_id, chk_exams_*, idx_exams_* already compliant

-- 06.02 exam_sections
ALTER TABLE public.exam_sections RENAME CONSTRAINT exam_sections_pkey TO pk_exam_sections;
ALTER TABLE public.exam_sections RENAME CONSTRAINT fk_exam_sections_tenant TO fk_exam_sections_institutes;
ALTER TABLE public.exam_sections RENAME CONSTRAINT fk_exam_sections_exam TO fk_exam_sections_exams;
ALTER TABLE public.exam_sections RENAME CONSTRAINT fk_exam_sections_subject TO fk_exam_sections_subjects;
ALTER TABLE public.exam_sections RENAME CONSTRAINT fk_exam_sections_created_by TO fk_exam_sections_users_created_by;
ALTER TABLE public.exam_sections RENAME CONSTRAINT fk_exam_sections_updated_by TO fk_exam_sections_users_updated_by;
ALTER TABLE public.exam_sections RENAME CONSTRAINT fk_exam_sections_deleted_by TO fk_exam_sections_users_deleted_by;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_order TO chk_exam_sections_order;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_marks TO chk_exam_sections_marks;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_question_count TO chk_exam_sections_question_count;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_marks_per_q TO chk_exam_sections_marks_per_q;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_negative_marks TO chk_exam_sections_negative_marks;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_duration TO chk_exam_sections_duration;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_name TO chk_exam_sections_name;
ALTER TABLE public.exam_sections RENAME CONSTRAINT chk_section_version TO chk_exam_sections_version;
-- uq_exam_sections_tenant_id, idx_exam_sections_* already compliant

-- 06.03 exam_questions
ALTER TABLE public.exam_questions RENAME CONSTRAINT exam_questions_pkey TO pk_exam_questions;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_tenant TO fk_exam_questions_institutes;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_exam TO fk_exam_questions_exams;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_section TO fk_exam_questions_exam_sections;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_chapter TO fk_exam_questions_chapters;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_created_by TO fk_exam_questions_users_created_by;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_updated_by TO fk_exam_questions_users_updated_by;
ALTER TABLE public.exam_questions RENAME CONSTRAINT fk_exam_questions_deleted_by TO fk_exam_questions_users_deleted_by;
ALTER TABLE public.exam_questions RENAME CONSTRAINT uq_exam_question_order TO uq_exam_questions_exam_id_display_order;
ALTER TABLE public.exam_questions RENAME CONSTRAINT chk_exam_question_order TO chk_exam_questions_order;
ALTER TABLE public.exam_questions RENAME CONSTRAINT chk_exam_question_marks TO chk_exam_questions_marks;
ALTER TABLE public.exam_questions RENAME CONSTRAINT chk_exam_question_negative TO chk_exam_questions_negative_marks;
ALTER TABLE public.exam_questions RENAME CONSTRAINT chk_exam_question_type TO chk_exam_questions_type;
ALTER TABLE public.exam_questions RENAME CONSTRAINT chk_exam_question_version TO chk_exam_questions_version;
-- uq_exam_questions_tenant_id, idx_exam_questions_* already compliant

-- 06.04 question_papers
ALTER TABLE public.question_papers RENAME CONSTRAINT question_papers_pkey TO pk_question_papers;
ALTER TABLE public.question_papers RENAME CONSTRAINT fk_qp_tenant TO fk_question_papers_institutes;
ALTER TABLE public.question_papers RENAME CONSTRAINT fk_qp_course TO fk_question_papers_courses;
ALTER TABLE public.question_papers RENAME CONSTRAINT fk_qp_subject TO fk_question_papers_subjects;
ALTER TABLE public.question_papers RENAME CONSTRAINT fk_qp_created_by TO fk_question_papers_users_created_by;
ALTER TABLE public.question_papers RENAME CONSTRAINT fk_qp_updated_by TO fk_question_papers_users_updated_by;
ALTER TABLE public.question_papers RENAME CONSTRAINT fk_qp_deleted_by TO fk_question_papers_users_deleted_by;
ALTER TABLE public.question_papers RENAME CONSTRAINT uq_qp_tenant_id TO uq_question_papers_tenant_id;
ALTER TABLE public.question_papers RENAME CONSTRAINT uq_qp_code TO uq_question_papers_paper_code;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_code TO chk_question_papers_code;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_title TO chk_question_papers_title;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_total_marks TO chk_question_papers_total_marks;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_duration TO chk_question_papers_duration;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_status TO chk_question_papers_status;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_published_version TO chk_question_papers_published_version;
ALTER TABLE public.question_papers RENAME CONSTRAINT chk_qp_version TO chk_question_papers_version;
ALTER INDEX IF EXISTS idx_qp_tenant_course RENAME TO idx_question_papers_tenant_course;
ALTER INDEX IF EXISTS idx_qp_tenant_subject RENAME TO idx_question_papers_tenant_subject;
ALTER INDEX IF EXISTS idx_qp_tenant_status RENAME TO idx_question_papers_tenant_status;

-- 06.05 question_paper_questions
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT question_paper_questions_pkey TO pk_question_paper_questions;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT fk_qpq_paper TO fk_question_paper_questions_question_papers;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT fk_qpq_question TO fk_question_paper_questions_questions;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT fk_qpq_created_by TO fk_question_paper_questions_users_created_by;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT fk_qpq_updated_by TO fk_question_paper_questions_users_updated_by;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT fk_qpq_deleted_by TO fk_question_paper_questions_users_deleted_by;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT uq_qpq_tenant_id TO uq_question_paper_questions_tenant_id;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT uq_qpq_paper_question TO uq_question_paper_questions_paper_id_question_id;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT uq_qpq_paper_order TO uq_question_paper_questions_paper_id_display_order;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT chk_qpq_marks TO chk_question_paper_questions_marks;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT chk_qpq_negative_marks TO chk_question_paper_questions_negative_marks;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT chk_qpq_display_order TO chk_question_paper_questions_display_order;
ALTER TABLE public.question_paper_questions RENAME CONSTRAINT chk_qpq_version TO chk_question_paper_questions_version;
ALTER INDEX IF EXISTS idx_qpq_paper RENAME TO idx_question_paper_questions_paper;
ALTER INDEX IF EXISTS idx_qpq_question RENAME TO idx_question_paper_questions_question;
ALTER INDEX IF EXISTS idx_qpq_tenant RENAME TO idx_question_paper_questions_tenant;
ALTER INDEX IF EXISTS idx_qpq_section RENAME TO idx_question_paper_questions_section;

-- 06.06 exam_registrations
ALTER TABLE public.exam_registrations RENAME CONSTRAINT exam_registrations_pkey TO pk_exam_registrations;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT fk_exam_registrations_tenant TO fk_exam_registrations_institutes;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT fk_exam_registrations_exam TO fk_exam_registrations_exams;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT fk_exam_registrations_admission TO fk_exam_registrations_student_admissions;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT fk_exam_registrations_created_by TO fk_exam_registrations_users_created_by;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT fk_exam_registrations_updated_by TO fk_exam_registrations_users_updated_by;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT fk_exam_registrations_deleted_by TO fk_exam_registrations_users_deleted_by;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT uq_exam_registration TO uq_exam_registrations_exam_id_enrollment_id;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT chk_registration_admit_card TO chk_exam_registrations_admit_card;
ALTER TABLE public.exam_registrations RENAME CONSTRAINT chk_registration_version TO chk_exam_registrations_version;
ALTER INDEX IF EXISTS uq_part_exam_reg_tenant_roll RENAME TO idx_uq_exam_registrations_roll_number;
ALTER INDEX IF EXISTS uq_part_exam_reg_tenant_hall RENAME TO idx_uq_exam_registrations_hall_ticket;
-- idx_exam_registrations_* already compliant

-- 06.07 exam_attempts
ALTER TABLE public.exam_attempts RENAME CONSTRAINT exam_attempts_pkey TO pk_exam_attempts;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT fk_exam_attempts_tenant TO fk_exam_attempts_institutes;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT fk_exam_attempts_exam TO fk_exam_attempts_exams;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT fk_exam_attempts_enrollment TO fk_exam_attempts_student_batch_enrollments;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT fk_exam_attempts_created_by TO fk_exam_attempts_users_created_by;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT fk_exam_attempts_updated_by TO fk_exam_attempts_users_updated_by;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT fk_exam_attempts_deleted_by TO fk_exam_attempts_users_deleted_by;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT uq_exam_attempt TO uq_exam_attempts_exam_id_enrollment_id;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_timing TO chk_exam_attempts_timing;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_auto_submit TO chk_exam_attempts_auto_submit;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_time_taken TO chk_exam_attempts_time_taken;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_time_paused TO chk_exam_attempts_time_paused;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_answer_sheet TO chk_exam_attempts_answer_sheet;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_submitted_by_system TO chk_exam_attempts_submitted_by_system;
ALTER TABLE public.exam_attempts RENAME CONSTRAINT chk_attempt_version TO chk_exam_attempts_version;
-- uq_exam_attempts_tenant_id, idx_exam_attempts_* already compliant

-- 06.08 exam_answers
ALTER TABLE public.exam_answers RENAME CONSTRAINT exam_answers_pkey TO pk_exam_answers;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_tenant TO fk_exam_answers_institutes;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_attempt TO fk_exam_answers_exam_attempts;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_question TO fk_exam_answers_exam_questions;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_evaluated_by TO fk_exam_answers_users_evaluated_by;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_created_by TO fk_exam_answers_users_created_by;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_updated_by TO fk_exam_answers_users_updated_by;
ALTER TABLE public.exam_answers RENAME CONSTRAINT fk_exam_answers_deleted_by TO fk_exam_answers_users_deleted_by;
ALTER TABLE public.exam_answers RENAME CONSTRAINT uq_exam_answer TO uq_exam_answers_attempt_id_question_id;
ALTER TABLE public.exam_answers RENAME CONSTRAINT chk_answer_evaluation TO chk_exam_answers_evaluation;
ALTER TABLE public.exam_answers RENAME CONSTRAINT chk_answer_selected_option TO chk_exam_answers_selected_option;
ALTER TABLE public.exam_answers RENAME CONSTRAINT chk_answer_marks TO chk_exam_answers_marks;
ALTER TABLE public.exam_answers RENAME CONSTRAINT chk_answer_version TO chk_exam_answers_version;
ALTER TABLE public.exam_answers RENAME CONSTRAINT chk_answer_status TO chk_exam_answers_status;
-- idx_exam_answers_* already compliant

-- 06.09 exam_results
ALTER TABLE public.exam_results RENAME CONSTRAINT exam_results_pkey TO pk_exam_results;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_tenant TO fk_exam_results_institutes;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_exam TO fk_exam_results_exams;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_attempt TO fk_exam_results_exam_attempts;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_enrollment TO fk_exam_results_student_batch_enrollments;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_published_by TO fk_exam_results_users_published_by;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_re_evaluated_by TO fk_exam_results_users_re_evaluated_by;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_created_by TO fk_exam_results_users_created_by;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_updated_by TO fk_exam_results_users_updated_by;
ALTER TABLE public.exam_results RENAME CONSTRAINT fk_exam_results_deleted_by TO fk_exam_results_users_deleted_by;
ALTER TABLE public.exam_results RENAME CONSTRAINT uq_exam_result TO uq_exam_results_exam_id_attempt_id;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_marks TO chk_exam_results_marks;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_counts TO chk_exam_results_counts;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_percentage TO chk_exam_results_percentage;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_percentile TO chk_exam_results_percentile;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_rank TO chk_exam_results_rank;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_publishing TO chk_exam_results_publishing;
ALTER TABLE public.exam_results RENAME CONSTRAINT chk_result_version TO chk_exam_results_version;
-- uq_exam_results_tenant_id, idx_exam_results_* already compliant

-- 06.10 exam_result_history
ALTER TABLE public.exam_result_history RENAME CONSTRAINT exam_result_history_pkey TO pk_exam_result_history;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT fk_exam_result_history_tenant TO fk_exam_result_history_institutes;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT fk_exam_result_history_result TO fk_exam_result_history_exam_results;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT fk_exam_result_history_exam TO fk_exam_result_history_exams;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT fk_exam_result_history_enrollment TO fk_exam_result_history_student_batch_enrollments;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT fk_exam_result_history_changed_by TO fk_exam_result_history_users_changed_by;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT chk_result_history_marks TO chk_exam_result_history_marks;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT chk_result_history_delta TO chk_exam_result_history_delta;
ALTER TABLE public.exam_result_history RENAME CONSTRAINT chk_result_history_reason TO chk_exam_result_history_reason;
-- uq_exam_result_history_tenant_id, idx_exam_result_history_* already compliant

-- 06.11 exam_documents
ALTER TABLE public.exam_documents RENAME CONSTRAINT exam_documents_pkey TO pk_exam_documents;
ALTER TABLE public.exam_documents RENAME CONSTRAINT fk_exam_documents_tenant TO fk_exam_documents_institutes;
ALTER TABLE public.exam_documents RENAME CONSTRAINT fk_exam_documents_exam TO fk_exam_documents_exams;
ALTER TABLE public.exam_documents RENAME CONSTRAINT fk_exam_documents_created_by TO fk_exam_documents_users_created_by;
ALTER TABLE public.exam_documents RENAME CONSTRAINT fk_exam_documents_updated_by TO fk_exam_documents_users_updated_by;
ALTER TABLE public.exam_documents RENAME CONSTRAINT fk_exam_documents_deleted_by TO fk_exam_documents_users_deleted_by;
ALTER TABLE public.exam_documents RENAME CONSTRAINT chk_document_name TO chk_exam_documents_name;
ALTER TABLE public.exam_documents RENAME CONSTRAINT chk_document_order TO chk_exam_documents_order;
ALTER TABLE public.exam_documents RENAME CONSTRAINT chk_document_file_size TO chk_exam_documents_file_size;
ALTER TABLE public.exam_documents RENAME CONSTRAINT chk_document_version TO chk_exam_documents_version;
-- uq_exam_documents_tenant_id, idx_exam_documents_* already compliant
