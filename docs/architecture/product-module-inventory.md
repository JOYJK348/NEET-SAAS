# Product Module Inventory

This document acts as the definitive catalog of all functional areas, features, and actions within the Coaching Management Platform. It serves as the prerequisite foundation for Menu Master design, Permission Catalogs, and Authorization Flows.

## Rules & Constraints
1. **Business-First Hierarchy**: Organized strictly as `Module` ➔ `Sub-Module` ➔ `Feature` ➔ `Page` ➔ `Actions`.
2. **Unique Feature IDs**: Every feature carries a persistent unique alphanumeric ID code.
3. **No Roles or Workflows**: Describes *what* features exist, not *who* accesses them or *how* they are routed.
4. **Metadata Rules**: Every feature must define its **Description**, **Dependencies**, and **Status** (`ACTIVE`, `BETA`, `DEPRECATED`).

---

## 1. Platform Configuration (PLF)

*   **Sub-Module: Tenant Registry**
    *   **Feature: Tenant Profile** [ID: `PLF-TEN-001`]
        *   *Description:* Allows editing global institute variables and configuring tenant themes/white-label settings.
        *   *Dependencies:* None
        *   *Status:* `ACTIVE`
        *   *Page:* Tenant Configuration Portal
        *   *Actions:*
            *   `view_profile`
            *   `update_profile`
            *   `toggle_white_labeling`
*   **Sub-Module: Branch Management**
    *   **Feature: Branch Config** [ID: `PLF-BRN-001`]
        *   *Description:* Managing physical branch registries under a tenant.
        *   *Dependencies:* `PLF-TEN-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Branch Directory & Setups
        *   *Actions:*
            *   `view_branches`
            *   `create_branch`
            *   `update_branch`
            *   `delete_branch`
*   **Sub-Module: Academic Year Setup**
    *   **Feature: Academic Term Config** [ID: `PLF-ACY-001`]
        *   *Description:* Creating term calendar boundary thresholds.
        *   *Dependencies:* `PLF-TEN-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Term Calendar Registry
        *   *Actions:*
            *   `view_terms`
            *   `create_term`
            *   `update_term`

---

## 2. Authentication & Identity (ATH)

*   **Sub-Module: Core Authentication**
    *   **Feature: Session Controls** [ID: `ATH-SES-001`]
        *   *Description:* Handles user login requests, OTP generation, and session expiration timeouts.
        *   *Dependencies:* None
        *   *Status:* `ACTIVE`
        *   *Page:* Login & Verification Screens
        *   *Actions:*
            *   `authenticate_user`
            *   `terminate_session`
            *   `verify_otp`
*   **Sub-Module: Staff Profiles**
    *   **Feature: Staff Directory** [ID: `ATH-STF-001`]
        *   *Description:* Creating and deactivating profiles for faculty, tutors, and branch administrators.
        *   *Dependencies:* `PLF-BRN-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Staff Profile Manager
        *   *Actions:*
            *   `view_staff`
            *   `create_staff`
            *   `update_staff`
            *   `deactivate_staff`

---

## 3. Admissions (ADM)

*   **Sub-Module: Student Registration**
    *   **Feature: Student Intake** [ID: `ADM-STU-001`]
        *   *Description:* Handles dynamic admissions pipelines, enrolling student data profiles.
        *   *Dependencies:* `PLF-BRN-001`, `PLF-ACY-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Student Profile Registry
        *   *Actions:*
            *   `view_students`
            *   `register_student`
            *   `update_student_profile`
            *   `export_student_data`
*   **Sub-Module: Document Verification**
    *   **Feature: Document Vault** [ID: `ADM-DOC-001`]
        *   *Description:* Secure document uploads (identities, past school certificates).
        *   *Dependencies:* `ADM-STU-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Student Documents Portal
        *   *Actions:*
            *   `view_documents`
            *   `upload_document`
            *   `delete_document`
*   **Sub-Module: Parent Registry**
    *   **Feature: Parent Link** [ID: `ADM-PAR-001`]
        *   *Description:* Tracking parents contact parameters mapping them to students profiles.
        *   *Dependencies:* `ADM-STU-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Parent Profiles Directory
        *   *Actions:*
            *   `view_parents`
            *   `link_parent_student`
            *   `update_parent_profile`

---

## 4. Academics (ACD)

*   **Sub-Module: Curriculum Catalog**
    *   **Feature: Courses & Subjects Map** [ID: `ACD-CUR-001`]
        *   *Description:* Building courses, subjects, and curriculum chapters mappings.
        *   *Dependencies:* `PLF-TEN-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Syllabus Master Portal
        *   *Actions:*
            *   `view_curriculum`
            *   `create_course`
            *   `update_course`
            *   `create_subject`
            *   `update_subject`
*   **Sub-Module: Batch Execution**
    *   **Feature: Batch Allocations** [ID: `ACD-BAT-001`]
        *   *Description:* Constructing specific classroom batches mapped to target courses and assigning primary tutors.
        *   *Dependencies:* `ACD-CUR-001`, `ATH-STF-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Batch Setup Panel
        *   *Actions:*
            *   `view_batches`
            *   `create_batch`
            *   `update_batch`
            *   `assign_batch_tutor`
*   **Sub-Module: Timetable Scheduling**
    *   **Feature: Timetable Slots** [ID: `ACD-SCH-001`]
        *   *Description:* Weekly timetable slot mapping, room numbers, and coordinate reschedule/cancellation override workflows.
        *   *Dependencies:* `ACD-BAT-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Weekly Slot Scheduler
        *   *Actions:*
            *   `view_schedule`
            *   `generate_weekly_slots`
            *   `update_slot`
            *   `override_slot`

---

## 5. Attendance (ATT)

*   **Sub-Module: Live Attendance**
    *   **Feature: Daily Check-In** [ID: `ATT-LIV-001`]
        *   *Description:* Registers active slot-level and daily attendance of student cohorts.
        *   *Dependencies:* `ADM-STU-001`, `ACD-SCH-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Attendance Marker Sheet
        *   *Actions:*
            *   `view_attendance_sheets`
            *   `mark_attendance`
            *   `override_attendance_record`

---

## 6. Learning & Content (LRN)

*   **Sub-Module: Study Resources**
    *   **Feature: Learning Materials** [ID: `LRN-MAT-001`]
        *   *Description:* Managing file vaults for PDFs, PPTs, study notes.
        *   *Dependencies:* `ACD-CUR-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Study Materials Vault
        *   *Actions:*
            *   `view_materials`
            *   `upload_material`
            *   `update_material`
            *   `delete_material`
            *   `submit_material_for_approval`
*   **Sub-Module: Media Content**
    *   **Feature: Recorded Video Lectures** [ID: `LRN-VID-001`]
        *   *Description:* Managing class lecture streaming videos.
        *   *Dependencies:* `ACD-CUR-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Lecture Video Player & Manager
        *   *Actions:*
            *   `view_videos`
            *   `upload_video`
            *   `update_video`
            *   `delete_video`
*   **Sub-Module: Homework & Assignments**
    *   **Feature: Homework Submissions** [ID: `LRN-ASG-001`]
        *   *Description:* Issuing assignments, tracking responses, and marking score evaluations.
        *   *Dependencies:* `ACD-BAT-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Assignment Portal
        *   *Actions:*
            *   `view_assignments`
            *   `create_assignment`
            *   `update_assignment`
            *   `submit_assignment`
            *   `grade_assignment`

---

## 7. Examinations (EXM)

*   **Sub-Module: Question Bank**
    *   **Feature: Questions Vault** [ID: `EXM-QB-001`]
        *   *Description:* Database of multi-choice questions (MCQs) for NEET, indexed by course, subject, and chapter.
        *   *Dependencies:* `ACD-CUR-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Dynamic Question Bank Index
        *   *Actions:*
            *   `view_questions`
            *   `create_question`
            *   `update_question`
            *   `delete_question`
*   **Sub-Module: Online Mock Tests (CBT)**
    *   **Feature: CBT Exam Console** [ID: `EXM-CBT-001`]
        *   *Description:* Creation of mock tests templates and processing student CBT interface lobbies.
        *   *Dependencies:* `EXM-QB-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Exam Paper Creator & Exam Lobby
        *   *Actions:*
            *   `view_exams`
            *   `create_exam_template`
            *   `update_exam_template`
            *   `launch_cbt_attempt`
            *   `submit_cbt_answers`
*   **Sub-Module: Evaluation & Scores**
    *   **Feature: Academic Scores Tracker** [ID: `EXM-SCO-001`]
        *   *Description:* Processing mock test scoring keys and final grade card parameters.
        *   *Dependencies:* `EXM-CBT-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Gradesheet Manager
        *   *Actions:*
            *   `view_scores`
            *   `input_offline_scores`
            *   `evaluate_pending_tests`

---

## 8. Fees & Billing (FEE)

*   **Sub-Module: Fee Structure Configuration**
    *   **Feature: Fee Tariffs** [ID: `FEE-STR-001`]
        *   *Description:* Creating structures for courses fee structures, installments, and payment plans.
        *   *Dependencies:* `ACD-CUR-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Tariff Config Sheets
        *   *Actions:*
            *   `view_tariffs`
            *   `create_tariff`
            *   `update_tariff`
*   **Sub-Module: Ledger Transactions**
    *   **Feature: Payment Processing** [ID: `FEE-PAY-001`]
        *   *Description:* Manual collections, checkouts, and ledger concession waive actions.
        *   *Dependencies:* `FEE-STR-001`, `ADM-STU-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Transaction Cash Register
        *   *Actions:*
            *   `view_transactions`
            *   `initiate_checkout`
            *   `process_manual_payment`
            *   `waive_ledger_due`
            *   `generate_payment_receipt`

---

## 9. Communication (COM)

*   **Sub-Module: Public Announcements**
    *   **Feature: Notice Board** [ID: `COM-ANN-001`]
        *   *Description:* Broadcast of notices and push notifications.
        *   *Dependencies:* `PLF-TEN-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Announcement Editor & Feed
        *   *Actions:*
            *   `view_announcements`
            *   `create_announcement`
            *   `update_announcement`
            *   `broadcast_announcement`

---

## 10. AI Assistant Portal (AIS)

*   **Sub-Module: AI Tutor**
    *   **Feature: Interactive AI Coach** [ID: `AIS-TUT-001`]
        *   *Description:* Dynamic AI coaching engine for students solving Physics/Biology questions.
        *   *Dependencies:* `EXM-QB-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Student AI Chat Interface
        *   *Actions:*
            *   `launch_chat_session`
            *   `submit_ai_query`
            *   `view_chat_history`
*   **Sub-Module: AI Prompt Settings**
    *   **Feature: Prompt Management** [ID: `AIS-PRM-001`]
        *   *Description:* Allows editing instructions, models, parameters, and system prompts of the AI coach.
        *   *Dependencies:* `PLF-TEN-001`
        *   *Status:* `BETA`
        *   *Page:* Global Prompt System Settings
        *   *Actions:*
            *   `view_prompts`
            *   `create_prompt_template`
            *   `update_prompt_template`

---

## 11. Reports & Analytics (RPT)

*   **Sub-Module: Performance Reports**
    *   **Feature: Student Academic Analytics** [ID: `RPT-ANA-001`]
        *   *Description:* Unified metrics and analytics charting attendance rates, scores, and fee completion.
        *   *Dependencies:* `ATT-LIV-001`, `EXM-SCO-001`, `FEE-PAY-001`
        *   *Status:* `ACTIVE`
        *   *Page:* Consolidated Progress Dashboard
        *   *Actions:*
            *   `view_progress_charts`
            *   `export_analytics_pdf`
