# Domain Ownership Matrix

This document defines the strict architectural boundaries, ownership structures, and cross-domain relational references for the coaching platform database schemas.

---

## 1. Domain Matrix

| Domain Schema | Owns Entities (Source of Truth) | References (Foreign Keys) | RLS Strategy |
|---|---|---|---|
| **01 Institute** | `institutes`, `branches`, `academic_years`, `subscriptions`, `holidays` | None | Global Tenant Context / Branch Scoped |
| **02 User** | `users`, `auth_identities`, `roles`, `permissions`, `role_permissions`, `user_tenant_roles`, `refresh_tokens`, `login_histories`, `departments`, `staff_profiles`, `staff_employment`, `staff_qualifications`, `staff_compensations`, `staff_subjects` | `institutes`, `branches` | Tenant Scoped / Self Scoped |
| **03 Academic** | `courses`, `batches`, `subjects`, `batch_subjects`, `timetable_slots`, `batch_tutors`, `timetable_exceptions` | `institutes`, `branches`, `staff_profiles` | Tenant Scoped / Branch Scoped |
| **04 Student** | `student_profiles`, `guardian_profiles`, `student_guardians`, `student_emergency_contacts`, `student_medical_profiles`, `student_documents`, `batch_enrollments`, `batch_transfer_logs` | `users`, `batches`, `file_versions` | Tenant Scoped / Parent Self / Student Self |
| **05 Attendance**| `student_attendance`, `timetable_attendance_logs` | `student_profiles`, `timetable_slots`, `staff_profiles` | Branch Scoped |
| **06 Assessment**| `questions`, `question_versions`, `question_options`, `question_answers`, `tags`, `question_tags`, `assessment_templates`, `assessment_sections`, `assessment_papers`, `assessment_paper_questions`, `assessment_sessions`, `student_assessment_attempts`, `student_responses`, `omr_sheet_uploads`, `assessment_results`, `assessment_result_subjects`, `re_evaluation_requests` | `institutes`, `branches`, `batches`, `subjects`, `topics`, `student_profiles`, `users` | Tenant Scoped / Branch Scoped |
| **07 Fee** | `fee_structures`, `fee_installments`, `student_fee_mappings`, `transactions`, `fee_discounts`, `fee_waiver_requests` | `institutes`, `branches`, `student_profiles`, `users` | Tenant Scoped / Parent Self |
| **08 Comm** | `announcements`, `notifications`, `sms_logs`, `email_logs`, `chat_channels`, `chat_messages` | `institutes`, `branches`, `users` | Tenant Scoped / Self Scoped |
| **09 CRM** | `leads`, `lead_notes`, `lead_activities`, `followups` | `institutes`, `users` | Tenant Scoped / Coordinator Scoped |
| **10 Analytics** | `dashboard_kpi_snapshots`, `student_performance_summaries`, `counsellor_conversion_analytics`, `daily_branch_attendance_aggregations`, `lms_student_aggregations`, `staff_performance_aggregations`, `question_bank_statistics`, `batch_analytics`, `daily_ai_usage_aggregations` | `student_profiles`, `staff_profiles`, `questions`, `batches` | Tenant Scoped / Read-only |
| **11 System** | `audit_logs`, `files`, `file_versions`, `background_jobs`, `background_job_logs`, `notification_queue`, `ai_conversations`, `ai_vector_chunks`, `ai_usage_logs`, `webhook_integrations`, `webhook_logs`, `api_keys` | `institutes`, `users`, `files` | Tenant Scoped / System Only |
| **12 LMS** | `chapters`, `topics`, `topic_prerequisites`, `study_materials`, `study_material_revisions`, `study_material_views`, `batch_material_access`, `live_sessions`, `live_session_recordings`, `live_session_participants`, `assignments`, `assignment_revisions`, `assignment_questions`, `assignment_submissions`, `submission_attempts`, `student_topic_progress`, `student_learning_history` | `subjects`, `topics`, `batches`, `timetable_slots`, `staff_profiles`, `student_profiles`, `file_versions`, `question_versions`, `users` | Tenant Scoped / Branch Scoped / Student Self |

---

## 2. Cross-Domain Integrity Rules

1. **No Circular Database References**:
   * Downstream domains (`12-lms`, `06-assessment`, `04-student`) may reference upstream domains (`02-user`, `03-academic`).
   * Upstream domains must never contain foreign keys pointing to downstream domains.
2. **File Storage Isolation**:
   * No domain may directly reference the physical cloud bucket url. All files must resolve through `11-system` `file_versions.id` pointers.
3. **Question Catalog Decoupling**:
   * The reusable Question Bank catalog resides inside the Assessment domain but is consumed by LMS assignments via `assignment_questions` junctions.
