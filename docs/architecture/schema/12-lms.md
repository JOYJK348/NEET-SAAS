# 📖 Learning Management System (LMS) Domain Database Schema

> **Domain:** LMS Core (Digital Curriculum, Study Materials, Assignments & Timings)  
> **Owner Team:** Academic / LMS Team  
> **Database:** PostgreSQL (Supabase)  
> **Schema Version:** 1.1  
> **Status:** 🟡 Draft  
> **Parent ERD:** `docs/architecture/erd/04-learning.md`  
> **Last Reviewed By:** — (Pending)

---

## 1. Overview

**Purpose:** The LMS Domain manages the digital learning experience of students. It maps the academic syllabus from `03-academic` into structured chapters and topics, hosts study files and video classes, monitors real-time streaming participant logs, schedules assignments, and tracks granular topic completion metrics for AI dashboards.

**Contains:**
- Chapter
- Topic
- Topic Prerequisite
- Study Material (PDFs, Notes, Links)
- Study Material Revision
- Study Material View (Aggregates)
- Batch Material Access (Availability configurations)
- Live Session (Zoom, Jitsi streaming)
- Live Session Recording
- Live Session Participant
- Assignment (Homework & Quiz configurations)
- Assignment Revision
- Assignment Question (Junction to reusable Question Bank)
- Assignment Submission
- Submission Attempt
- Student Topic Progress
- Student Learning History (Append-only telemetry logs)

**Domain Type:** 🔥 Hot — Telemetry logs (`student_learning_history`), material views, live session attendance updates, and homework submissions represent high-frequency write operations during school terms.

---

## 2. Business Scope

### ✅ Included
- Syllabus chapter and topic segments mapping estimated duration limits and topic prerequisites.
- Study materials supporting type categorizations (VIDEO, PDF, DOCUMENT, AUDIO, LINK, EMBED) and metadata change revisions logs.
- Batch visibility configurations defining `visible_from` and `visible_until` parameters.
- Live stream sessions tracking scheduled vs actual times, providers context, and participant logs (duration, ip_hash, browser specs).
- Live session recordings linked to transcoding statuses, thumbnails, and visibility states (PRIVATE, BATCH_ONLY, PUBLIC).
- Homework assignments containing publishing checks (`DRAFT`, `REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`), assignment locks, and multi-attempts grading metrics.
- Detailed student topic completion metrics mapping total watch time and attempts counts.
- Append-only telemetry log recording micro-actions (OPEN, CLOSE, PLAY, PAUSE, SEEK).

### ❌ Excluded
- **Timetable Slots** → Academic Domain (`03-academic.md`) — timelining class slots belongs to core scheduling operations.
- **Physical Student Data** → Student Domain (`04-student.md`) — Holds demographics registries.
- **Base Questions Catalog** → Assessment Domain (`06-assessment.md`) — Dynamic versioned catalog of questions.

---

## 3. Global Conventions & Business Rules

1. **Global Soft-Delete**: All mutable LMS domain entities implement standard soft-delete columns (`deleted_at`, `deleted_by`) unless explicitly marked immutable.
2. **Batch Enrollment Lock**: A student cannot submit an assignment unless they are actively enrolled in a batch that has visibility access to the parent assignment.
3. **No Circular Prerequisites**: A topic cannot have a prerequisite that directly or indirectly depends on itself.
4. **Publishing Gate**: Materials and assignments in states other than `PUBLISHED` are completely hidden from student profiles.
5. **Conflict Prevention**: Assignments cannot set `visible_from` after the `due_date`.
6. **Progress Integrity**: Progress is stamped with the `content_version` value matching the active revision at completion time.
7. **Direct Tenant Scoping**: Every business table must store `institute_id` directly to simplify RLS indexing policies and avoid deep nested join query checks.

---

## 4. Enum Definitions

### `MaterialType`
| Value | Description |
|---|---|
| `VIDEO` | MP4 or HLS streaming content |
| `PDF` | Portable Document Format slides |
| `DOCUMENT` | Text document notes |
| `AUDIO` | Voice explanations notes |
| `LINK` | External website bookmarks |
| `EMBED` | Inline HTML elements |

### `PublishStatus`
| Value | Description |
|---|---|
| `DRAFT` | Workspace design stage |
| `REVIEW` | Submitted to coordinator |
| `APPROVED` | Verified for launch |
| `PUBLISHED` | Visible to active batch students |
| `ARCHIVED` | Hidden historical content |

### `LiveSessionStatus`
| Value | Description |
|---|---|
| `SCHEDULED` | Created, waiting activation |
| `LIVE` | Session in progress |
| `COMPLETED` | Session ended |
| `CANCELLED` | Session cancelled |

### `RecordingVisibility`
| Value | Description |
|---|---|
| `PRIVATE` | Admin/Host access only |
| `BATCH_ONLY` | Target batch students only |
| `PUBLIC` | Open academy resource |

### `AssignmentType`
| Value | Description |
|---|---|
| `HOMEWORK` | Post-class study tasks |
| `QUIZ` | Short evaluation tasks |
| `PROJECT` | Long-term study tasks |
| `LAB` | Practical worksheets |

### `AttemptStatus`
| Value | Description |
|---|---|
| `IN_PROGRESS` | Student currently editing |
| `SUBMITTED` | Submitted, awaiting evaluation |
| `EXPIRED` | Due date passed without submission |

### `HistoryAction`
| Value | Description |
|---|---|
| `OPEN` | Resource loaded |
| `CLOSE` | Resource closed |
| `PLAY` | Video playback started |
| `PAUSE` | Video paused |
| `SEEK` | Video timeline shifted |
| `DOWNLOAD` | File downloaded |
| `COMPLETE` | Resource fully consumed |

---

## 5. Entity Design

### 5.1 `chapters`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (RLS Tenant Scoping) |
| `subject_id` | UUID | No | - | FK → `subjects.id` (Academic Domain) |
| `name` | VARCHAR(255) | No | - | Chapter title |
| `code` | VARCHAR(50) | No | - | Tenant-unique chapter code |
| `display_order` | INT | No | `1` | Ordering index |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `created_by` | UUID | Yes | - | Audit: creator |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: updater |
| `updated_by` | UUID | Yes | - | Audit: updater FK |
| `deleted_at` | TIMESTAMPTZ | Yes | - | Audit: Soft-delete |
| `deleted_by` | UUID | Yes | - | Audit: soft-deleter |

---

### 5.2 `topics`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (RLS Tenant Scoping) |
| `chapter_id` | UUID | No | - | FK → `chapters.id` |
| `name` | VARCHAR(255) | No | - | Topic title |
| `display_order` | INT | No | `1` | Ordering index |
| `estimated_hours` | NUMERIC(4,2) | No | `1.00` | Estimated instruction hours |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `created_by` | UUID | Yes | - | Audit: creator |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: updater |
| `updated_by` | UUID | Yes | - | Audit: updater FK |
| `deleted_at` | TIMESTAMPTZ | Yes | - | Audit: Soft-delete |
| `deleted_by` | UUID | Yes | - | Audit: soft-deleter |

---

### 5.3 `topic_prerequisites`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `topic_id` | UUID | No | - | FK → `topics.id` (PK) |
| `prerequisite_topic_id`| UUID | No | - | FK → `topics.id` (PK) |

---

### 5.4 `study_materials`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (RLS Tenant Scoping) |
| `topic_id` | UUID | No | - | FK → `topics.id` |
| `name` | VARCHAR(255) | No | - | Material title |
| `description` | TEXT | Yes | - | Brief content details |
| `material_type` | `MaterialType` | No | `'PDF'` | Format categorization |
| `display_order` | INT | No | `1` | Rendering order |
| `estimated_read_time`| INT | No | `5` | Target reading minutes |
| `publish_status` | `PublishStatus` | No | `'DRAFT'` | Publishing lifecycle |
| `published_at` | TIMESTAMPTZ | Yes | - | Launch timestamp |
| `published_by` | UUID | Yes | - | Publisher FK → `users.id` |
| `file_version_id` | UUID | No | - | FK → `file_versions.id` (System Storage Link) |
| `is_downloadable` | BOOLEAN | No | `true` | Download visibility toggle |
| `xmin` | OID | No | - | System optimistic lock identifier (PostgreSQL system column check) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `created_by` | UUID | Yes | - | Audit: creator |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: updater |
| `updated_by` | UUID | Yes | - | Audit: updater FK |
| `deleted_at` | TIMESTAMPTZ | Yes | - | Audit: Soft-delete |
| `deleted_by` | UUID | Yes | - | Audit: soft-deleter |

---

### 5.5 `study_material_revisions`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `study_material_id` | UUID | No | - | FK → `study_materials.id` |
| `version_number` | INT | No | `1` | Incremental version number |
| `title_snapshot` | VARCHAR(255) | No | - | Frozen title |
| `description_snapshot`| TEXT | Yes | - | Frozen description |
| `changed_by` | UUID | No | - | Actor FK → `users.id` |
| `created_at` | TIMESTAMPTZ | No | `now()` | Revision timestamp |

---

### 5.6 `study_material_views`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `student_profile_id` | UUID | No | - | FK → `student_profiles.id` (PK) |
| `study_material_id` | UUID | No | - | FK → `study_materials.id` (PK) |
| `view_count` | INT | No | `1` | Total click count counter |
| `last_viewed_at` | TIMESTAMPTZ | No | `now()` | Last viewed timestamp |

---

### 5.7 `batch_material_access`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `batch_id` | UUID | No | - | FK → `batches.id` (Academic Domain) |
| `study_material_id` | UUID | No | - | FK → `study_materials.id` |
| `is_locked` | BOOLEAN | No | `false` | Access lock indicator |
| `visible_from` | TIMESTAMPTZ | No | `now()` | Access open window start |
| `visible_until` | TIMESTAMPTZ | Yes | - | Optional access window end |

---

### 5.8 `live_sessions`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (RLS Tenant Scoping) |
| `batch_id` | UUID | No | - | FK → `batches.id` |
| `timetable_slot_id` | UUID | Yes | - | FK → `timetable_slots.id` (Nullable exception link) |
| `topic_id` | UUID | No | - | FK → `topics.id` |
| `staff_profile_id` | UUID | No | - | FK → `staff_profiles.id` (Tutor host) |
| `provider` | `MeetingProvider` | No | `'JITSI'` | Zoom / Jitsi / GMeet provider |
| `meeting_id` | VARCHAR(255) | No | - | Provider room reference ID |
| `provider_metadata` | JSONB | Yes | - | Zoom / Jitsi metadata parameters: `{meetingId, encryptedPassword, hostKey, recordingId}` |
| `status` | `LiveSessionStatus`| No | `'SCHEDULED'`| Stream execution status |
| `attendance_locked_at`| TIMESTAMPTZ| Yes | - | Locked attendance marker |
| `scheduled_start` | TIMESTAMPTZ | No | - | Scheduled start |
| `scheduled_end` | TIMESTAMPTZ | No | - | Scheduled end |
| `actual_start` | TIMESTAMPTZ | Yes | - | Actual session start time |
| `actual_end` | TIMESTAMPTZ | Yes | - | Actual session end time |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `created_by` | UUID | Yes | - | Audit: creator |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: updater |
| `updated_by` | UUID | Yes | - | Audit: updater FK |
| `deleted_at` | TIMESTAMPTZ | Yes | - | Audit: Soft-delete |
| `deleted_by` | UUID | Yes | - | Audit: soft-deleter |

---

### 5.9 `live_session_recordings`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `live_session_id` | UUID | No | - | FK → `live_sessions.id` |
| `file_version_id` | UUID | No | - | FK → `file_versions.id` (R2 raw MP4 link) |
| `processing_status` | `RecordingStatus`| No | `'PENDING'` | Transcoding transcode queue status |
| `processing_completed_at`| TIMESTAMPTZ| Yes | - | Transcode completion timestamp |
| `transcoding_status`| VARCHAR(100) | Yes | - | Tracing metrics logs |
| `duration_seconds` | INT | No | `0` | Calculated video duration |
| `resolution` | VARCHAR(50) | Yes | - | Transcoded video resolution (e.g. 1080p) |
| `visibility_status` | `RecordingVisibility`| No | `'BATCH_ONLY'`| Viewing restrictions |
| `thumbnail_file_version_id`| UUID | No | - | FK → `file_versions.id` (Thumbnail link) |

---

### 5.10 `live_session_participants`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `student_profile_id` | UUID | No | - | FK → `student_profiles.id` (Student PK) |
| `live_session_id` | UUID | No | - | FK → `live_sessions.id` (Session PK) |
| `joined_at` | TIMESTAMPTZ | No | `now()` | Entry timestamp |
| `left_at` | TIMESTAMPTZ | Yes | - | Exit timestamp |
| `duration_minutes` | INT | No | `0` | Calculated class engagement minutes |
| `client_metadata` | JSONB | Yes | - | Hashed client IP & parsed browser specs |

---

### 5.11 `assignments`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (RLS Tenant Scoping) |
| `topic_id` | UUID | No | - | FK → `topics.id` |
| `title` | VARCHAR(255) | No | - | Homework title |
| `instructions` | TEXT | Yes | - | Directives explanation |
| `publish_status` | `PublishStatus` | No | `'DRAFT'` | Publishing workflow status |
| `published_at` | TIMESTAMPTZ | Yes | - | Launch timestamp |
| `published_by` | UUID | Yes | - | Coordinator publisher FK → `users.id` |
| `max_marks` | NUMERIC(6,2) | No | `10.00` | Target potential max score |
| `available_from` | TIMESTAMPTZ | No | `now()` | Access opens window |
| `due_date` | TIMESTAMPTZ | No | - | Deadline limits |
| `assignment_type` | `AssignmentType` | No | `'HOMEWORK'` | Homework / quiz categorization |
| `is_submission_locked`| BOOLEAN | No | `false` | Late submission lock toggle |
| `xmin` | OID | No | - | System optimistic lock identifier (PostgreSQL system column check) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `created_by` | UUID | Yes | - | Audit: creator |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: updater |
| `updated_by` | UUID | Yes | - | Audit: updater FK |
| `deleted_at` | TIMESTAMPTZ | Yes | - | Audit: Soft-delete |
| `deleted_by` | UUID | Yes | - | Audit: soft-deleter |

---

### 5.12 `assignment_revisions`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `assignment_id` | UUID | No | - | FK → `assignments.id` |
| `version_number` | INT | No | `1` | Incremental version number |
| `title_snapshot` | VARCHAR(255) | No | - | Frozen title |
| `instructions_snapshot`| TEXT | Yes | - | Frozen instructions |
| `due_date_snapshot` | TIMESTAMPTZ | No | - | Frozen deadline date |
| `changed_by` | UUID | No | - | Actor FK → `users.id` |
| `created_at` | TIMESTAMPTZ | No | `now()` | Revision timestamp |

---

### 5.13 `assignment_questions`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `assignment_id` | UUID | No | - | FK → `assignments.id` (PK) |
| `question_version_id` | UUID | No | - | FK → `question_versions.id` (PK - links reusable bank) |
| `sequence_number` | INT | No | - | Question display position index |
| `marks` | NUMERIC(4,2) | No | `1.00` | Section correct marking weight |
| `negative_marks` | NUMERIC(4,2) | No | `0.00` | Penalty marking weight |

---

### 5.14 `assignment_submissions`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `assignment_id` | UUID | No | - | FK → `assignments.id` |
| `student_profile_id` | UUID | No | - | FK → `student_profiles.id` (Student link) |
| `submission_status` | `AttemptStatus`| No | `'IN_PROGRESS'`| Attempt status tracking |
| `attempts_used` | INT | No | `1` | Active attempt count counter |
| `max_attempts` | INT | No | `3` | Maximum allowed attempts |
| `batch_id_snapshot` | UUID | No | - | Snapshot: Historic batch ID reference |
| `batch_name_snapshot` | VARCHAR(255) | No | - | Snapshot: Historic batch label |
| `subject_id_snapshot` | UUID | No | - | Snapshot: Historic subject ID reference |
| `subject_name_snapshot`| VARCHAR(255)| No | - | Snapshot: Historic subject label |
| `chapter_id_snapshot` | UUID | No | - | Snapshot: Historic chapter ID reference |
| `chapter_name_snapshot`| VARCHAR(255)| No | - | Snapshot: Historic chapter label |
| `created_at` | TIMESTAMPTZ | No | `now()` | Registry submission date |

---

### 5.15 `submission_attempts`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `assignment_submission_id`| UUID | No | - | FK → `assignment_submissions.id` |
| `attempt_number` | INT | No | - | Attempt sequence index |
| `attempt_status` | `AttemptStatus`| No | `'IN_PROGRESS'`| Attempt operational status |
| `file_version_id` | UUID | Yes | - | FK → `file_versions.id` (Optional upload attachment link) |
| `submitted_at` | TIMESTAMPTZ | Yes | - | Lock execution timestamp |
| `graded_at` | TIMESTAMPTZ | Yes | - | Tutor grading timestamp |
| `plagiarism_score` | NUMERIC(5,2) | Yes | - | AI derived copied matching percentage |
| `late_submission` | BOOLEAN | No | `false` | Late flag checks |
| `is_final_attempt` | BOOLEAN | No | `true` | Evaluation target indicator |
| `score_obtained` | NUMERIC(6,2) | Yes | - | Calculated grading score |
| `grading_staff_id` | UUID | Yes | - | Grading tutor FK → `staff_profiles.id` |
| `feedback_notes` | TEXT | Yes | - | Evaluator remarks comments |

---

### 5.16 `student_topic_progress`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `student_profile_id` | UUID | No | - | FK → `student_profiles.id` (PK) |
| `topic_id` | UUID | No | - | FK → `topics.id` (PK) |
| `started_at` | TIMESTAMPTZ | No | `now()` | Progression start date |
| `completed_at` | TIMESTAMPTZ | Yes | - | Progression end date |
| `completion_percentage`| NUMERIC(5,2)| No | `0.00` | Percentage check (0.00 ... 100.00) |
| `last_accessed_at` | TIMESTAMPTZ | No | `now()` | Activity tracker timestamp |
| `total_watch_time_seconds`| INT| No | `0` | Total play seconds |
| `total_attempts_count`| INT | No | `0` | Assignments submission count |
| `is_completed` | BOOLEAN | No | `false` | Completion status flag |
| `content_version` | INT | No | `1` | Locked revision version link |
| `completed_materials` | INT | No | `0` | Number of completed materials |
| `total_materials` | INT | No | `0` | Total materials under topic |
| `completed_assignments`| INT | No | `0` | Number of completed assignments |
| `total_assignments` | INT | No | `0` | Total assignments under topic |

---

### 5.17 `student_learning_history`
| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `student_profile_id` | UUID | No | - | FK → `student_profiles.id` |
| `resource_type` | `HistoryAction` | No | - | Action tag (e.g. PLAY, CLOSE) |
| `study_material_id` | UUID | Yes | - | FK → `study_materials.id` (Nullable check) |
| `assignment_id` | UUID | Yes | - | FK → `assignments.id` (Nullable check) |
| `live_session_id` | UUID | Yes | - | FK → `live_sessions.id` (Nullable check) |
| `duration_watched_sec`| INT | No | `0` | Session play seconds |
| `created_at` | TIMESTAMPTZ | No | `now()` | Event record log time |

---

## 6. Foreign Keys

### `chapters` Foreign Keys
| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |
| `subject_id` | `subjects.id` | Restrict | Cascade | Yes | No | No (Immediate) |

### `topics` Foreign Keys
| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |
| `chapter_id` | `chapters.id` | Cascade | Cascade | Yes | No | No (Immediate) |

### `study_materials` Foreign Keys
| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |
| `topic_id` | `topics.id` | Restrict | Cascade | Yes | No | No (Immediate) |
| `file_version_id`| `file_versions.id`| Restrict | Cascade | Yes | No | No (Immediate) |

### `live_sessions` Foreign Keys
| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |
| `batch_id` | `batches.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |
| `timetable_slot_id` | `timetable_slots.id` | Set Null | Cascade | Yes | No | No (Immediate) |
| `topic_id` | `topics.id` | Restrict | Cascade | Yes | No | No (Immediate) |
| `staff_profile_id` | `staff_profiles.id` | Restrict | Cascade | Yes | No | No (Immediate) |

### `assignments` Foreign Keys
| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |
| `topic_id` | `topics.id` | Restrict | Cascade | Yes | No | No (Immediate) |

---

## 7. Constraints

### Database-Enforced Constraints

| Constraint Name | Type | Table | Columns | Business Rule |
|---|---|---|---|---|
| `uq_chapters_code` | Unique | `chapters` | `(subject_id, code)` | Unique chapter code per subject |
| `uq_study_material_views` | Unique | `study_material_views` | `(student_profile_id, study_material_id)`| Single view aggregation row |
| `chk_materials_read_time` | Check | `study_materials` | `estimated_read_time >= 0` | Cannot be negative |
| `chk_live_sessions_dates` | Check | `live_sessions` | `scheduled_start < scheduled_end` | Start before end |
| `chk_live_sessions_actual` | Check | `live_sessions` | `actual_start < actual_end` | Start before end |
| `chk_assignments_dates` | Check | `assignments` | `available_from <= due_date` | Launch before deadline |
| `chk_assignment_questions_marks`| Check | `assignment_questions`| `marks >= 0` | Cannot be negative |
| `chk_submission_attempts_score`| Check | `submission_attempts` | `score_obtained <= score_obtained` | Attempt score validation bounds |
| `chk_student_topic_progress_pct`| Check | `student_topic_progress`| `completion_percentage BETWEEN 0.00 AND 100.00`| Ratio check limits |
| `chk_learning_history_fk` | Check | `student_learning_history` | See Section 7.1 | Explicit FK integrity validation |

### 7.1 `chk_learning_history_fk` CHECK constraint:
```sql
ALTER TABLE student_learning_history ADD CONSTRAINT chk_learning_history_fk CHECK (
  (study_material_id IS NOT NULL AND assignment_id IS NULL AND live_session_id IS NULL) OR
  (assignment_id IS NOT NULL AND study_material_id IS NULL AND live_session_id IS NULL) OR
  (live_session_id IS NOT NULL AND study_material_id IS NULL AND assignment_id IS NULL)
);
```

---

## 8. Index Strategy

| Index Name | Table | Columns | Include (Covering) | Supports Query | Type | Justification |
|---|---|---|---|---|---|---|
| `idx_topics_chapter` | `topics` | `(chapter_id)` | `(id, display_order)` | Syllabus query | B-tree | Ordered topics retrieval |
| `idx_study_materials_topic`| `study_materials` | `(topic_id, publish_status)` | `(id, file_version_id, material_type)` | Content query | B-tree | Active materials list |
| `idx_live_sessions_batch` | `live_sessions` | `(batch_id, status)` | `(id, scheduled_start, scheduled_end)` | Stream lookup | B-tree | Class schedule checks |
| `idx_assignment_submissions_std`| `assignment_submissions`| `(student_profile_id, assignment_id)`| `(submission_status)` | Submissions list | B-tree | Student dashboard queries |
| `idx_submission_attempts_sub`| `submission_attempts` | `(assignment_submission_id)`| `(attempt_number, score_obtained)` | Grades checklist | B-tree | Evaluator markings runs |
| `idx_topic_progress_student`| `student_topic_progress` | `(student_profile_id)` | `(topic_id, is_completed)` | Progress tracking | B-tree | Student profile progress checks |
| `idx_learning_history_logs`| `student_learning_history`| `(student_profile_id, created_at)`| `(resource_type, duration_watched_sec)` | Telemetry dump | B-tree | Append-only event telemetry scans |

---

## 9. Security Notes & Supabase RLS

- **Supabase RLS**:
  * Read access is permitted for any authenticated user belonging to the batch context defined in the User Domain mappings.
  * Homework submissions writes are permitted only for active students whose profile matches `student_profile_id`.
  * Chapter/Topic curriculum edits, materials upload setups, and grading runs require coordinator credentials resolved via custom claims in JWT context.
