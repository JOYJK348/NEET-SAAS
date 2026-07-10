-- ============================================================================
-- SQL File: 00.02_types.sql
-- Domain: Global Database ENUM Types Registration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Register only highly stable, static concepts as native ENUMs.
-- 2. Avoid business workflow status variables here (delegated to CHECK constraints).
-- 3. Utilize DO blocks to enforce idempotent creation (CREATE TYPE doesn't support IF NOT EXISTS).
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Biological gender type registration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');
    END IF;
END $$;
COMMENT ON TYPE gender_type IS 'Biological gender values classification';

-- 2. Blood groups classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_group_type') THEN
        CREATE TYPE blood_group_type AS ENUM (
            'A_POS', 'A_NEG',
            'B_POS', 'B_NEG',
            'AB_POS', 'AB_NEG',
            'O_POS', 'O_NEG'
        );
    END IF;
END $$;
COMMENT ON TYPE blood_group_type IS 'Standard human ABO and Rh blood groups';

-- 3. Standard weekdays definitions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weekday_type') THEN
        CREATE TYPE weekday_type AS ENUM (
            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
        );
    END IF;
END $$;
COMMENT ON TYPE weekday_type IS 'Days of the week catalog representation';

-- 4. Notification outbox delivery channels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comms_channel_type') THEN
        CREATE TYPE comms_channel_type AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WHATSAPP');
    END IF;
END $$;
COMMENT ON TYPE comms_channel_type IS 'Dispatched communication outbound carrier channels';

-- 5. Timesheet tracking scanner check-in directions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clock_direction_type') THEN
        CREATE TYPE clock_direction_type AS ENUM ('IN', 'OUT');
    END IF;
END $$;
COMMENT ON TYPE clock_direction_type IS 'Chronological timesheet entrance boundaries';

-- 6. File Storage providers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_provider_type') THEN
        CREATE TYPE storage_provider_type AS ENUM ('LOCAL', 'R2', 'S3');
    END IF;
END $$;
COMMENT ON TYPE storage_provider_type IS 'Active binary assets storage hosting provider target';

-- 7. Document Visibility classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_visibility_type') THEN
        CREATE TYPE document_visibility_type AS ENUM ('PUBLIC', 'PRIVATE');
    END IF;
END $$;
COMMENT ON TYPE document_visibility_type IS 'Global access permissions level wrapper for file resources';

-- 8. Branch operational classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_type') THEN
        CREATE TYPE branch_type AS ENUM ('HEAD_OFFICE', 'CAMPUS', 'FRANCHISE', 'ONLINE');
    END IF;
END $$;
COMMENT ON TYPE branch_type IS 'Operational classification for branch nodes';

-- 9. Attendance delivery mode configurations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_mode_type') THEN
        CREATE TYPE attendance_mode_type AS ENUM ('CLASSROOM', 'ONLINE', 'HYBRID');
    END IF;
END $$;
COMMENT ON TYPE attendance_mode_type IS 'Attendance tracking delivery mode (e.g. CLASSROOM, ONLINE, HYBRID)';

-- 10. Batch lifecycle lifecycle status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_status_type') THEN
        CREATE TYPE batch_status_type AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE batch_status_type IS 'Operational lifecycle status classifications for batch records';

-- 11. User classification groups configurations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('STAFF', 'STUDENT', 'PARENT', 'TUTOR', 'SYSTEM');
    END IF;
END $$;
COMMENT ON TYPE user_type_enum IS 'Global classification group classification for users profile';

-- 12. User profile lifecycle status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_type') THEN
        CREATE TYPE user_status_type AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
    END IF;
END $$;
COMMENT ON TYPE user_status_type IS 'Profile lifecycle states classifications for users profile';

-- 13. Role assignment origin tracking configurations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_assignment_source') THEN
        CREATE TYPE role_assignment_source AS ENUM ('MANUAL', 'SYSTEM', 'MIGRATION', 'API', 'IMPORT');
    END IF;
END $$;
COMMENT ON TYPE role_assignment_source IS 'Origin system method identifier of user roles associations';

-- 14. Menu UI Node structural classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'menu_node_type') THEN
        CREATE TYPE menu_node_type AS ENUM ('MODULE', 'GROUP', 'MENU');
    END IF;
END $$;
COMMENT ON TYPE menu_node_type IS 'Structural type classifications for menu navigation nodes';

-- 15. User session state classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status_type') THEN
        CREATE TYPE session_status_type AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'LOGGED_OUT');
    END IF;
END $$;
COMMENT ON TYPE session_status_type IS 'State tracker parameters for user sessions';

-- 16. Security audit event classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_event_type') THEN
        CREATE TYPE auth_event_type AS ENUM (
            'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 
            'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS',
            'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILED',
            'SESSION_REVOKED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED'
        );
    END IF;
END $$;
COMMENT ON TYPE auth_event_type IS 'Classification codes for authentication and security audits logs';

-- 17. Staff contract employment classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type_enum') THEN
        CREATE TYPE employment_type_enum AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING');
    END IF;
END $$;
COMMENT ON TYPE employment_type_enum IS 'Contractual classification categories for workforce employees';

-- 18. Staff status lifecycle classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status_enum') THEN
        CREATE TYPE employment_status_enum AS ENUM ('ACTIVE', 'ON_NOTICE', 'RESIGNED', 'TERMINATED', 'SUSPENDED');
    END IF;
END $$;
COMMENT ON TYPE employment_status_enum IS 'Status states mapping active employee track record';

-- 19. Student academic status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academic_status_enum') THEN
        CREATE TYPE academic_status_enum AS ENUM ('ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'ALUMNI');
    END IF;
END $$;
COMMENT ON TYPE academic_status_enum IS 'Status states mapping active student enrollment track';

-- 20. Parent to student relationship classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parent_relationship_type_enum') THEN
        CREATE TYPE parent_relationship_type_enum AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');
    END IF;
END $$;
COMMENT ON TYPE parent_relationship_type_enum IS 'Demographic relationship categories mapping parents to students profiles';

-- 21. Attendance session lifecycle status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_session_status_enum') THEN
        CREATE TYPE attendance_session_status_enum AS ENUM ('DRAFT', 'OPEN', 'PUBLISHED', 'LOCKED');
    END IF;
END $$;
COMMENT ON TYPE attendance_session_status_enum IS 'Lifecycle status of an attendance-taking session header';

-- 22. Individual student attendance check-in status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
        CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED');
    END IF;
END $$;
COMMENT ON TYPE attendance_status_enum IS 'Check-in status for individual student attendance records';

-- 23. Leave request approval workflow status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status_enum') THEN
        CREATE TYPE leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
    END IF;
END $$;
COMMENT ON TYPE leave_status_enum IS 'Approval workflow state for student and staff leave requests';

-- 24. Leave request category classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_category_enum') THEN
        CREATE TYPE leave_category_enum AS ENUM ('SICK', 'CASUAL', 'EMERGENCY', 'DUTY', 'OTHER');
    END IF;
END $$;
COMMENT ON TYPE leave_category_enum IS 'Category classification for leave request types';

-- 25. Exam type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type_enum') THEN
        CREATE TYPE exam_type_enum AS ENUM ('WEEKLY', 'MONTHLY', 'GRAND', 'FULL_SYLLABUS', 'CHAPTER', 'UNIT', 'REVISION', 'PRACTICE', 'SCHOLARSHIP');
    END IF;
END $$;
COMMENT ON TYPE exam_type_enum IS 'Classification categories for exam types';

-- 26. Exam delivery modes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_mode_enum') THEN
        CREATE TYPE exam_mode_enum AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');
    END IF;
END $$;
COMMENT ON TYPE exam_mode_enum IS 'Delivery mode for exam conduction';

-- 27. Exam publish lifecycle statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_publish_status_enum') THEN
        CREATE TYPE exam_publish_status_enum AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'CANCELLED');
    END IF;
END $$;
COMMENT ON TYPE exam_publish_status_enum IS 'Lifecycle states for exam publish workflow';

-- 28. Exam record statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_status_enum') THEN
        CREATE TYPE exam_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE exam_status_enum IS 'Operational status for exam records';

-- 29. Exam attempt lifecycle statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attempt_status_enum') THEN
        CREATE TYPE attempt_status_enum AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED', 'DISQUALIFIED');
    END IF;
END $$;
COMMENT ON TYPE attempt_status_enum IS 'Lifecycle states for student exam attempts';

-- 30. Exam result statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'result_status_enum') THEN
        CREATE TYPE result_status_enum AS ENUM ('PENDING', 'EVALUATING', 'PUBLISHED', 'WITHHELD', 'RE_EVALUATED');
    END IF;
END $$;
COMMENT ON TYPE result_status_enum IS 'Lifecycle states for exam result computation and publishing';

-- 31. Question difficulty ratings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_difficulty_enum') THEN
        CREATE TYPE question_difficulty_enum AS ENUM ('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD');
    END IF;
END $$;
COMMENT ON TYPE question_difficulty_enum IS 'Difficulty classification for questions in analytics';

-- 32. Answer evaluation statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'answer_status_enum') THEN
        CREATE TYPE answer_status_enum AS ENUM ('CORRECT', 'INCORRECT', 'PARTIAL', 'UNATTEMPTED', 'FLAGGED');
    END IF;
END $$;
COMMENT ON TYPE answer_status_enum IS 'Classification of individual student answer correctness';

-- 33. Evaluation workflow statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluation_status_enum') THEN
        CREATE TYPE evaluation_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'RE_EVALUATION');
    END IF;
END $$;
COMMENT ON TYPE evaluation_status_enum IS 'Workflow states for answer evaluation processing';

-- 34. Exam registration statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status_enum') THEN
        CREATE TYPE registration_status_enum AS ENUM ('REGISTERED', 'CONFIRMED', 'CANCELLED', 'ABSENT');
    END IF;
END $$;
COMMENT ON TYPE registration_status_enum IS 'Lifecycle states for student exam registration';

-- 35. Exam fee payment statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_status_enum') THEN
        CREATE TYPE fee_status_enum AS ENUM ('PAID', 'UNPAID', 'PARTIAL', 'WAIVED', 'NOT_APPLICABLE');
    END IF;
END $$;
COMMENT ON TYPE fee_status_enum IS 'Fee payment status tracking for exam registrations';

-- 36. Exam document category classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category_enum') THEN
        CREATE TYPE document_category_enum AS ENUM ('QUESTION_PAPER', 'ANSWER_KEY', 'OMR_SCAN', 'SOLUTION_PDF', 'ADMIT_CARD', 'HALL_TICKET', 'RESULT_SHEET', 'OTHER');
    END IF;
END $$;
COMMENT ON TYPE document_category_enum IS 'Classification categories for exam-related documents';

-- 37. Question type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type_enum') THEN
        CREATE TYPE question_type_enum AS ENUM ('MCQ', 'MULTI_CORRECT', 'ASSERTION_REASON', 'TRUE_FALSE', 'MATCHING', 'NUMERICAL', 'DESCRIPTIVE');
    END IF;
END $$;
COMMENT ON TYPE question_type_enum IS 'Question format classifications for question bank';

-- 38. Question workflow statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status_enum') THEN
        CREATE TYPE question_status_enum AS ENUM ('DRAFT', 'REVIEW_PENDING', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE question_status_enum IS 'Lifecycle states for question bank questions';

-- 39. Question source origins
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_source_enum') THEN
        CREATE TYPE question_source_enum AS ENUM ('MANUAL', 'AI_GENERATED', 'IMPORT', 'BULK_UPLOAD', 'OCR', 'SCANNED');
    END IF;
END $$;
COMMENT ON TYPE question_source_enum IS 'Origin source of question creation';

-- 40. Bloom's taxonomy levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blooms_level_enum') THEN
        CREATE TYPE blooms_level_enum AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');
    END IF;
END $$;
COMMENT ON TYPE blooms_level_enum IS 'Bloom''s taxonomy cognitive level classification';

-- 41. Question attachment types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_type_enum') THEN
        CREATE TYPE attachment_type_enum AS ENUM ('IMAGE', 'DIAGRAM', 'PDF', 'AUDIO', 'VIDEO', 'FORMULA');
    END IF;
END $$;
COMMENT ON TYPE attachment_type_enum IS 'File attachment type classification for question assets';

-- 42. Question review workflow statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
        CREATE TYPE review_status_enum AS ENUM ('PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');
    END IF;
END $$;
COMMENT ON TYPE review_status_enum IS 'Academic review workflow states for question approval';

-- 43. Bulk import job statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_status_enum') THEN
        CREATE TYPE import_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');
    END IF;
END $$;
COMMENT ON TYPE import_status_enum IS 'Bulk question import job lifecycle states';

-- 44. Question tag type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tag_type_enum') THEN
        CREATE TYPE tag_type_enum AS ENUM ('TOPIC', 'CHAPTER', 'DIFFICULTY', 'EXAM_TYPE', 'FREQUENCY', 'SOURCE', 'CUSTOM');
    END IF;
END $$;
COMMENT ON TYPE tag_type_enum IS 'Classification categories for question tags';
