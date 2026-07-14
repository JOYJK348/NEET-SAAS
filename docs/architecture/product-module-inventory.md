# Product Module Inventory

This document acts as the definitive catalog of all functional areas, features, and actions within the Coaching Management Platform. It serves as the prerequisite foundation for Menu Master design, Permission Catalogs, and Authorization Flows.

## Rules & Constraints

1. **Business-First Hierarchy**: Organized strictly as `Module` ➔ `Sub-Module` ➔ `Feature` ➔ `Page` ➔ `Actions`.
2. **Unique Feature IDs**: Every feature carries a persistent unique alphanumeric ID code.
3. **No Roles or Workflows**: Describes _what_ features exist, not _who_ accesses them or _how_ they are routed.
4. **Metadata Rules**: Every feature must define its **Description**, **Dependencies**, and **Status** (`ACTIVE`, `BETA`, `DEPRECATED`).

---

## 1. Platform Configuration (PLF)

- **Sub-Module: Tenant Registry**
  - **Feature: Tenant Profile** [ID: `PLF-TEN-001`]
    - _Description:_ Allows editing global institute variables and configuring tenant themes/white-label settings.
    - _Dependencies:_ None
    - _Status:_ `ACTIVE`
    - _Page:_ Tenant Configuration Portal
    - _Actions:_
      - `view_profile`
      - `update_profile`
      - `toggle_white_labeling`
- **Sub-Module: Branch Management**
  - **Feature: Branch Config** [ID: `PLF-BRN-001`]
    - _Description:_ Managing physical branch registries under a tenant.
    - _Dependencies:_ `PLF-TEN-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Branch Directory & Setups
    - _Actions:_
      - `view_branches`
      - `create_branch`
      - `update_branch`
      - `delete_branch`
- **Sub-Module: Academic Year Setup**
  - **Feature: Academic Term Config** [ID: `PLF-ACY-001`]
    - _Description:_ Creating term calendar boundary thresholds.
    - _Dependencies:_ `PLF-TEN-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Term Calendar Registry
    - _Actions:_
      - `view_terms`
      - `create_term`
      - `update_term`

---

## 2. Authentication & Identity (ATH)

- **Sub-Module: Core Authentication**
  - **Feature: Session Controls** [ID: `ATH-SES-001`]
    - _Description:_ Handles user login requests, OTP generation, and session expiration timeouts.
    - _Dependencies:_ None
    - _Status:_ `ACTIVE`
    - _Page:_ Login & Verification Screens
    - _Actions:_
      - `authenticate_user`
      - `terminate_session`
      - `verify_otp`
- **Sub-Module: Staff Profiles**
  - **Feature: Staff Directory** [ID: `ATH-STF-001`]
    - _Description:_ Creating and deactivating profiles for faculty, tutors, and branch administrators.
    - _Dependencies:_ `PLF-BRN-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Staff Profile Manager
    - _Actions:_
      - `view_staff`
      - `create_staff`
      - `update_staff`
      - `deactivate_staff`

---

## 3. Admissions (ADM)

- **Sub-Module: Student Registration**
  - **Feature: Student Intake** [ID: `ADM-STU-001`]
    - _Description:_ Handles dynamic admissions pipelines, enrolling student data profiles.
    - _Dependencies:_ `PLF-BRN-001`, `PLF-ACY-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Student Profile Registry
    - _Actions:_
      - `view_students`
      - `register_student`
      - `update_student_profile`
      - `export_student_data`
- **Sub-Module: Document Verification**
  - **Feature: Document Vault** [ID: `ADM-DOC-001`]
    - _Description:_ Secure document uploads (identities, past school certificates).
    - _Dependencies:_ `ADM-STU-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Student Documents Portal
    - _Actions:_
      - `view_documents`
      - `upload_document`
      - `delete_document`
- **Sub-Module: Parent Registry**
  - **Feature: Parent Link** [ID: `ADM-PAR-001`]
    - _Description:_ Tracking parents contact parameters mapping them to students profiles.
    - _Dependencies:_ `ADM-STU-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Parent Profiles Directory
    - _Actions:_
      - `view_parents`
      - `link_parent_student`
      - `update_parent_profile`

---

## 4. Academics (ACD)

- **Sub-Module: Curriculum Catalog**
  - **Feature: Courses & Subjects Map** [ID: `ACD-CUR-001`]
    - _Description:_ Building courses, subjects, and curriculum chapters mappings.
    - _Dependencies:_ `PLF-TEN-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Syllabus Master Portal
    - _Actions:_
      - `view_curriculum`
      - `create_course`
      - `update_course`
      - `create_subject`
      - `update_subject`
- **Sub-Module: Batch Execution**
  - **Feature: Batch Allocations** [ID: `ACD-BAT-001`]
    - _Description:_ Constructing specific classroom batches mapped to target courses and assigning primary tutors.
    - _Dependencies:_ `ACD-CUR-001`, `ATH-STF-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Batch Setup Panel
    - _Actions:_
      - `view_batches`
      - `create_batch`
      - `update_batch`
      - `assign_batch_tutor`
- **Sub-Module: Timetable Scheduling**
  - **Feature: Timetable Slots** [ID: `ACD-SCH-001`]
    - _Description:_ Weekly timetable slot mapping, room numbers, and coordinate reschedule/cancellation override workflows.
    - _Dependencies:_ `ACD-BAT-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Weekly Slot Scheduler
    - _Actions:_
      - `view_schedule`
      - `generate_weekly_slots`
      - `update_slot`
      - `override_slot`

---

## 5. Attendance (ATT)

- **Sub-Module: Live Attendance**
  - **Feature: Daily Check-In** [ID: `ATT-LIV-001`]
    - _Description:_ Registers active slot-level and daily attendance of student cohorts.
    - _Dependencies:_ `ADM-STU-001`, `ACD-SCH-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Attendance Marker Sheet
    - _Actions:_
      - `view_attendance_sheets`
      - `mark_attendance`
      - `override_attendance_record`

---

## 6. Learning & Content (LRN)

- **Sub-Module: Study Resources**
  - **Feature: Learning Materials** [ID: `LRN-MAT-001`]
    - _Description:_ Managing file vaults for PDFs, PPTs, study notes.
    - _Dependencies:_ `ACD-CUR-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Study Materials Vault
    - _Actions:_
      - `view_materials`
      - `upload_material`
      - `update_material`
      - `delete_material`
      - `submit_material_for_approval`
- **Sub-Module: Media Content**
  - **Feature: Recorded Video Lectures** [ID: `LRN-VID-001`]
    - _Description:_ Managing class lecture streaming videos.
    - _Dependencies:_ `ACD-CUR-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Lecture Video Player & Manager
    - _Actions:_
      - `view_videos`
      - `upload_video`
      - `update_video`
      - `delete_video`
- **Sub-Module: Homework & Assignments**
  - **Feature: Homework Submissions** [ID: `LRN-ASG-001`]
    - _Description:_ Issuing assignments, tracking responses, and marking score evaluations.
    - _Dependencies:_ `ACD-BAT-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Assignment Portal
    - _Actions:_
      - `view_assignments`
      - `create_assignment`
      - `update_assignment`
      - `submit_assignment`
      - `grade_assignment`

---

## 7. Examinations (EXM)

- **Sub-Module: Question Bank**
  - **Feature: Questions Vault** [ID: `EXM-QB-001`]
    - _Description:_ Database of multi-choice questions (MCQs) for NEET, indexed by course, subject, and chapter.
    - _Dependencies:_ `ACD-CUR-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Dynamic Question Bank Index
    - _Actions:_
      - `view_questions`
      - `create_question`
      - `update_question`
      - `delete_question`
- **Sub-Module: Online Mock Tests (CBT)**
  - **Feature: CBT Exam Console** [ID: `EXM-CBT-001`]
    - _Description:_ Creation of mock tests templates and processing student CBT interface lobbies.
    - _Dependencies:_ `EXM-QB-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Exam Paper Creator & Exam Lobby
    - _Actions:_
      - `view_exams`
      - `create_exam_template`
      - `update_exam_template`
      - `launch_cbt_attempt`
      - `submit_cbt_answers`
- **Sub-Module: Evaluation & Scores**
  - **Feature: Academic Scores Tracker** [ID: `EXM-SCO-001`]
    - _Description:_ Processing mock test scoring keys and final grade card parameters.
    - _Dependencies:_ `EXM-CBT-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Gradesheet Manager
    - _Actions:_
      - `view_scores`
      - `input_offline_scores`
      - `evaluate_pending_tests`

---

## 8. Fees & Billing (FEE)

- **Sub-Module: Fee Structure Configuration**
  - **Feature: Fee Tariffs** [ID: `FEE-STR-001`]
    - _Description:_ Creating structures for courses fee structures, installments, and payment plans.
    - _Dependencies:_ `ACD-CUR-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Tariff Config Sheets
    - _Actions:_
      - `view_tariffs`
      - `create_tariff`
      - `update_tariff`
- **Sub-Module: Ledger Transactions**
  - **Feature: Payment Processing** [ID: `FEE-PAY-001`]
    - _Description:_ Manual collections, checkouts, and ledger concession waive actions.
    - _Dependencies:_ `FEE-STR-001`, `ADM-STU-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Transaction Cash Register
    - _Actions:_
      - `view_transactions`
      - `initiate_checkout`
      - `process_manual_payment`
      - `waive_ledger_due`
      - `generate_payment_receipt`

---

## 9. Communication (COM)

- **Sub-Module: Public Announcements**
  - **Feature: Notice Board** [ID: `COM-ANN-001`]
    - _Description:_ Broadcast of notices and push notifications.
    - _Dependencies:_ `PLF-TEN-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Announcement Editor & Feed
    - _Actions:_
      - `view_announcements`
      - `create_announcement`
      - `update_announcement`
      - `broadcast_announcement`

---

## 10. AI Assistant Portal (AIS)

- **Sub-Module: AI Tutor**
  - **Feature: Interactive AI Coach** [ID: `AIS-TUT-001`]
    - _Description:_ Dynamic AI coaching engine for students solving Physics/Biology questions.
    - _Dependencies:_ `EXM-QB-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Student AI Chat Interface
    - _Actions:_
      - `launch_chat_session`
      - `submit_ai_query`
      - `view_chat_history`
- **Sub-Module: AI Prompt Settings**
  - **Feature: Prompt Management** [ID: `AIS-PRM-001`]
    - _Description:_ Allows editing instructions, models, parameters, and system prompts of the AI coach.
    - _Dependencies:_ `PLF-TEN-001`
    - _Status:_ `BETA`
    - _Page:_ Global Prompt System Settings
    - _Actions:_
      - `view_prompts`
      - `create_prompt_template`
      - `update_prompt_template`

---

## 11. Reports & Analytics (RPT)

- **Sub-Module: Performance Reports**
  - **Feature: Student Academic Analytics** [ID: `RPT-ANA-001`]
    - _Description:_ Unified metrics and analytics charting attendance rates, scores, and fee completion.
    - _Dependencies:_ `ATT-LIV-001`, `EXM-SCO-001`, `FEE-PAY-001`
    - _Status:_ `ACTIVE`
    - _Page:_ Consolidated Progress Dashboard
    - _Actions:_
      - `view_progress_charts`
      - `export_analytics_pdf`
