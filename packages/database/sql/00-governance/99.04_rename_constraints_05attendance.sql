-- =============================================================================
-- Constraint Rename Script — Phase 4: 05-attendance
-- =============================================================================

-- 05.01 attendance_sessions
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT attendance_sessions_pkey TO pk_attendance_sessions;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_tenant TO fk_attendance_sessions_institutes;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_branch TO fk_attendance_sessions_branches;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_academic_year TO fk_attendance_sessions_academic_years;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_batch TO fk_attendance_sessions_batches;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_subject TO fk_attendance_sessions_subjects;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_staff TO fk_attendance_sessions_staff_profiles;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_published_by TO fk_attendance_sessions_users_published_by;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_locked_by TO fk_attendance_sessions_users_locked_by;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_created_by TO fk_attendance_sessions_users_created_by;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_updated_by TO fk_attendance_sessions_users_updated_by;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT fk_as_deleted_by TO fk_attendance_sessions_users_deleted_by;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT chk_as_time TO chk_attendance_sessions_time;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT chk_as_published TO chk_attendance_sessions_published;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT chk_as_locked TO chk_attendance_sessions_locked;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT chk_as_remarks TO chk_attendance_sessions_remarks;
ALTER TABLE public.attendance_sessions RENAME CONSTRAINT chk_as_version TO chk_attendance_sessions_version;
ALTER INDEX IF EXISTS idx_as_batch_date RENAME TO idx_attendance_sessions_batch_date;
ALTER INDEX IF EXISTS idx_as_staff_date RENAME TO idx_attendance_sessions_staff_date;
ALTER INDEX IF EXISTS idx_as_tenant_date RENAME TO idx_attendance_sessions_tenant_date;
ALTER INDEX IF EXISTS idx_as_status RENAME TO idx_attendance_sessions_status;
ALTER INDEX IF EXISTS uq_part_as_batch_subject_date_slot RENAME TO idx_uq_attendance_sessions_batch_subject_date_slot;

-- 05.02 attendance_records
ALTER TABLE public.attendance_records RENAME CONSTRAINT attendance_records_pkey TO pk_attendance_records;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_session TO fk_attendance_records_attendance_sessions;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_student TO fk_attendance_records_student_admissions;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_tenant TO fk_attendance_records_institutes;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_marked_by TO fk_attendance_records_users_marked_by;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_created_by TO fk_attendance_records_users_created_by;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_updated_by TO fk_attendance_records_users_updated_by;
ALTER TABLE public.attendance_records RENAME CONSTRAINT fk_ar_deleted_by TO fk_attendance_records_users_deleted_by;
ALTER TABLE public.attendance_records RENAME CONSTRAINT chk_ar_late_minutes TO chk_attendance_records_late_minutes;
ALTER TABLE public.attendance_records RENAME CONSTRAINT chk_ar_remarks TO chk_attendance_records_remarks;
ALTER TABLE public.attendance_records RENAME CONSTRAINT chk_ar_version TO chk_attendance_records_version;
ALTER INDEX IF EXISTS uq_part_ar_session_student RENAME TO idx_uq_attendance_records_session_student;
ALTER INDEX IF EXISTS idx_ar_student RENAME TO idx_attendance_records_student;
ALTER INDEX IF EXISTS idx_ar_session RENAME TO idx_attendance_records_session;
ALTER INDEX IF EXISTS idx_ar_status RENAME TO idx_attendance_records_status;
ALTER INDEX IF EXISTS idx_ar_tenant RENAME TO idx_attendance_records_tenant;

-- 05.03 leave_requests
ALTER TABLE public.leave_requests RENAME CONSTRAINT leave_requests_pkey TO pk_leave_requests;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_tenant TO fk_leave_requests_institutes;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_requester TO fk_leave_requests_users_requester;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_approved_by TO fk_leave_requests_users_approved_by;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_cancelled_by TO fk_leave_requests_users_cancelled_by;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_created_by TO fk_leave_requests_users_created_by;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_updated_by TO fk_leave_requests_users_updated_by;
ALTER TABLE public.leave_requests RENAME CONSTRAINT fk_lr_deleted_by TO fk_leave_requests_users_deleted_by;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_dates TO chk_leave_requests_dates;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_requester_type TO chk_leave_requests_requester_type;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_reason TO chk_leave_requests_reason;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_approval TO chk_leave_requests_approval;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_cancellation TO chk_leave_requests_cancellation;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_rejection TO chk_leave_requests_rejection;
ALTER TABLE public.leave_requests RENAME CONSTRAINT chk_lr_version TO chk_leave_requests_version;
ALTER INDEX IF EXISTS idx_lr_requester RENAME TO idx_leave_requests_requester;
ALTER INDEX IF EXISTS idx_lr_dates RENAME TO idx_leave_requests_dates;
ALTER INDEX IF EXISTS idx_lr_tenant RENAME TO idx_leave_requests_tenant;

-- 05.04 attendance_adjustments
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT attendance_adjustments_pkey TO pk_attendance_adjustments;
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT fk_aa_record TO fk_attendance_adjustments_attendance_records;
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT fk_aa_tenant TO fk_attendance_adjustments_institutes;
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT fk_aa_changed_by TO fk_attendance_adjustments_users_changed_by;
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT fk_aa_created_by TO fk_attendance_adjustments_users_created_by;
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT chk_aa_status_change TO chk_attendance_adjustments_status_change;
ALTER TABLE public.attendance_adjustments RENAME CONSTRAINT chk_aa_reason TO chk_attendance_adjustments_reason;
ALTER INDEX IF EXISTS idx_aa_record RENAME TO idx_attendance_adjustments_record;
ALTER INDEX IF EXISTS idx_aa_tenant RENAME TO idx_attendance_adjustments_tenant;
ALTER INDEX IF EXISTS idx_aa_changed_by RENAME TO idx_attendance_adjustments_changed_by;
ALTER INDEX IF EXISTS idx_aa_changed_at RENAME TO idx_attendance_adjustments_changed_at;

-- 05.05 leave_attachments
ALTER TABLE public.leave_attachments RENAME CONSTRAINT leave_attachments_pkey TO pk_leave_attachments;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT fk_la_leave_request TO fk_leave_attachments_leave_requests;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT fk_la_tenant TO fk_leave_attachments_institutes;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT fk_la_verified_by TO fk_leave_attachments_users_verified_by;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT fk_la_created_by TO fk_leave_attachments_users_created_by;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT fk_la_updated_by TO fk_leave_attachments_users_updated_by;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT fk_la_deleted_by TO fk_leave_attachments_users_deleted_by;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_document_type TO chk_leave_attachments_document_type;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_storage_object TO chk_leave_attachments_storage_object;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_bucket_name TO chk_leave_attachments_bucket_name;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_mime_type TO chk_leave_attachments_mime_type;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_file_size TO chk_leave_attachments_file_size;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_verified TO chk_leave_attachments_verified;
ALTER TABLE public.leave_attachments RENAME CONSTRAINT chk_la_version TO chk_leave_attachments_version;
ALTER INDEX IF EXISTS idx_la_leave_request RENAME TO idx_leave_attachments_leave_request;
ALTER INDEX IF EXISTS idx_la_tenant RENAME TO idx_leave_attachments_tenant;
