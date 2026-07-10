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

-- 45. Learning material type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_material_type_enum') THEN
        CREATE TYPE learning_material_type_enum AS ENUM ('NOTES', 'VIDEO', 'PDF', 'DOC', 'PPT', 'ZIP', 'IMAGE', 'SVG', 'AUDIO', 'REVISION_SHEET', 'MIND_MAP', 'LAB_MANUAL', 'FLASH_CARDS', 'PRESENTATION', 'SLIDE', 'SUBTITLE', 'THUMBNAIL', 'QUIZ', 'ASSIGNMENT');
    END IF;
END $$;
COMMENT ON TYPE learning_material_type_enum IS 'Content format classifications for learning materials';

-- 46. Learning material lifecycle statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_material_status_enum') THEN
        CREATE TYPE learning_material_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE learning_material_status_enum IS 'Lifecycle states for learning materials';

-- 47. Material visibility levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_visibility_enum') THEN
        CREATE TYPE material_visibility_enum AS ENUM ('PUBLIC', 'COURSE_ONLY', 'BATCH_ONLY', 'PRIVATE');
    END IF;
END $$;
COMMENT ON TYPE material_visibility_enum IS 'Access visibility levels for learning materials';

-- 48. Learning progress statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status_enum') THEN
        CREATE TYPE progress_status_enum AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
    END IF;
END $$;
COMMENT ON TYPE progress_status_enum IS 'Student learning progress lifecycle states';

-- 49. Learning path statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_path_status_enum') THEN
        CREATE TYPE learning_path_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE learning_path_status_enum IS 'Lifecycle states for structured learning paths';

-- 50. Discussion statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_status_enum') THEN
        CREATE TYPE discussion_status_enum AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');
    END IF;
END $$;
COMMENT ON TYPE discussion_status_enum IS 'Status states for material discussion threads';

-- 51. Learning attachment type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_attachment_type_enum') THEN
        CREATE TYPE learning_attachment_type_enum AS ENUM ('VIDEO', 'PDF', 'DOC', 'PPT', 'ZIP', 'IMAGE', 'SVG', 'AUDIO', 'SUBTITLE', 'THUMBNAIL', 'SLIDE', 'DIAGRAM', 'FORMULA');
    END IF;
END $$;
COMMENT ON TYPE learning_attachment_type_enum IS 'File attachment type classifications for learning material assets';

-- 52. Student admission lifecycle statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_status_enum') THEN
        CREATE TYPE admission_status_enum AS ENUM ('ENQUIRY', 'ACTIVE', 'ON_HOLD', 'DROPPED', 'COMPLETED', 'ALUMNI');
    END IF;
END $$;
COMMENT ON TYPE admission_status_enum IS 'Lifecycle states for student admissions';

-- 53. Live class type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_type_enum') THEN
        CREATE TYPE live_class_type_enum AS ENUM ('LIVE', 'RECORDED', 'HYBRID', 'DOUBT_SESSION', 'REVISION', 'CRASH_COURSE', 'TEST_DISCUSSION');
    END IF;
END $$;
COMMENT ON TYPE live_class_type_enum IS 'Core instructional format classifications for live classes';

-- 54. Live class lifecycle status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_status_enum') THEN
        CREATE TYPE live_class_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'WAITING', 'LIVE', 'PAUSED', 'ENDED', 'CANCELLED', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE live_class_status_enum IS 'Publishing and execution status lifecycle for live class catalog entries';

-- 55. Meeting providers classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_provider_enum') THEN
        CREATE TYPE meeting_provider_enum AS ENUM ('ZOOM', 'GOOGLE_MEET', 'TEAMS', 'LMS_INTERNAL', 'OTHER');
    END IF;
END $$;
COMMENT ON TYPE meeting_provider_enum IS 'Supported external third-party teleconferencing platforms';

-- 56. Live class participant roles classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_role_enum') THEN
        CREATE TYPE participant_role_enum AS ENUM ('HOST', 'CO_HOST', 'MODERATOR', 'GUEST', 'OBSERVER');
    END IF;
END $$;
COMMENT ON TYPE participant_role_enum IS 'Privilege authorization levels for live class sessions participants';

-- 57. Video and Audio recordings processing status classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recording_status_enum') THEN
        CREATE TYPE recording_status_enum AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE recording_status_enum IS 'Post-production assembly states for class stream recordings';

-- 58. Live class poll execution lifecycle states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poll_status_enum') THEN
        CREATE TYPE poll_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
    END IF;
END $$;
COMMENT ON TYPE poll_status_enum IS 'Lifecycle execution states of interactive class polls';

-- 59. Live class poll response layout classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poll_type_enum') THEN
        CREATE TYPE poll_type_enum AS ENUM ('MCQ', 'MULTI_CORRECT', 'YES_NO');
    END IF;
END $$;
COMMENT ON TYPE poll_type_enum IS 'Layout format choices for teacher polls';

-- 60. Instant chat channels message classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_type_enum') THEN
        CREATE TYPE chat_message_type_enum AS ENUM ('TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM');
    END IF;
END $$;
COMMENT ON TYPE chat_message_type_enum IS 'Formats classification of instant messaging content payload';

-- 61. Live class downloadable resource files classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type_enum') THEN
        CREATE TYPE resource_type_enum AS ENUM ('PDF', 'PPT', 'WORKSHEET', 'IMAGE', 'VIDEO', 'LINK');
    END IF;
END $$;
COMMENT ON TYPE resource_type_enum IS 'Material types classification for downloadable reference materials';

-- 62. Telephony session closure cause classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_end_reason_enum') THEN
        CREATE TYPE session_end_reason_enum AS ENUM ('COMPLETED', 'HOST_LEFT', 'CRASHED', 'TIMEOUT', 'FORCE_CLOSED');
    END IF;
END $$;
COMMENT ON TYPE session_end_reason_enum IS 'Root causes categorization for session ending';

-- 63. Session active lifecycle states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status_enum') THEN
        CREATE TYPE session_status_enum AS ENUM ('CREATED', 'WAITING', 'STARTED', 'PAUSED', 'RESUMED', 'ENDED', 'FAILED');
    END IF;
END $$;
COMMENT ON TYPE session_status_enum IS 'Individual meeting connection lifecycle states';

-- 64. Hand raising attention request statuses classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'raise_hand_status_enum') THEN
        CREATE TYPE raise_hand_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'RESOLVED');
    END IF;
END $$;
COMMENT ON TYPE raise_hand_status_enum IS 'Doubt queue request status states';

-- 65. Live class timeline events trace categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_event_type_enum') THEN
        CREATE TYPE live_class_event_type_enum AS ENUM (
            'HOST_JOINED', 'HOST_LEFT', 'STUDENT_JOINED', 'STUDENT_LEFT', 
            'RECORDING_STARTED', 'RECORDING_STOPPED', 'POLL_CREATED', 'POLL_CLOSED', 
            'BREAKOUT_STARTED', 'BREAKOUT_ENDED', 'SCREEN_SHARE_STARTED', 'WHITEBOARD_OPENED', 
            'CHAT_DISABLED', 'MIC_DISABLED'
        );
    END IF;
END $$;
COMMENT ON TYPE live_class_event_type_enum IS 'Detailed timelines and interactions event trace classification';

-- 66. Fee structure lifecycle statuses classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_structure_status_enum') THEN
        CREATE TYPE fee_structure_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    END IF;
END $$;
COMMENT ON TYPE fee_structure_status_enum IS 'Lifecycle statuses for catalog fee structures';

-- 67. Student fee installment states classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_status_enum') THEN
        CREATE TYPE installment_status_enum AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED');
    END IF;
END $$;
COMMENT ON TYPE installment_status_enum IS 'Active payment state parameters for individual student installments';

-- 68. Payment dispatch method categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_GATEWAY');
    END IF;
END $$;
COMMENT ON TYPE payment_method_enum IS 'Supported payment methods categories';

-- 69. Gateway transaction execution state parameters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
        CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED');
    END IF;
END $$;
COMMENT ON TYPE transaction_status_enum IS 'External gateway transaction states mapping';

-- 70. Payment refunds approval lifecycle states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status_enum') THEN
        CREATE TYPE refund_status_enum AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED');
    END IF;
END $$;
COMMENT ON TYPE refund_status_enum IS 'Lifecycle processing states of cash or gateway refunds';

-- 71. Double-entry bank reconciliation match classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reconciliation_status_enum') THEN
        CREATE TYPE reconciliation_status_enum AS ENUM ('RECONCILED', 'UNMATCHED', 'DISCREPANCY');
    END IF;
END $$;
COMMENT ON TYPE reconciliation_status_enum IS 'Reconciliation match result statuses';

-- 72. Outbound reminders carrier options
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_notification_channel_enum') THEN
        CREATE TYPE fee_notification_channel_enum AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');
    END IF;
END $$;
COMMENT ON TYPE fee_notification_channel_enum IS 'Carrier delivery channels for billing and collection reminders';

-- 73. Reminders dispatch execution states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_notification_status_enum') THEN
        CREATE TYPE fee_notification_status_enum AS ENUM ('PENDING', 'SENT', 'FAILED');
    END IF;
END $$;
COMMENT ON TYPE fee_notification_status_enum IS 'Outbound delivery states classification for invoice reminders';

-- 74. Financial ledger administrative adjustments classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_type_enum') THEN
        CREATE TYPE adjustment_type_enum AS ENUM ('CREDIT', 'DEBIT');
    END IF;
END $$;
COMMENT ON TYPE adjustment_type_enum IS 'Transactional correction categories mapping ledger offsets';

-- 75. Daily cash drawer session closure statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'closure_status_enum') THEN
        CREATE TYPE closure_status_enum AS ENUM ('OPEN', 'CLOSED', 'RECONCILED');
    END IF;
END $$;
COMMENT ON TYPE closure_status_enum IS 'Daily session states mapping for cashiers collections';

-- 76. Audited events classification code categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_audit_event_type_enum') THEN
        CREATE TYPE fee_audit_event_type_enum AS ENUM (
            'STRUCTURE_CREATED', 'STRUCTURE_UPDATED', 'FEE_ASSIGNED', 'DISCOUNT_APPLIED', 
            'INSTALLMENT_OVERRIDDEN', 'PENALTY_ADDED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 
            'REFUND_PROCESSED', 'FEE_WAIVED', 'RECONCILIATION_MATCHED', 'ADJUSTMENT_APPLIED', 
            'CLOSURE_COMPLETED'
        );
    END IF;
END $$;
COMMENT ON TYPE fee_audit_event_type_enum IS 'Operational audit events classification for billing collections';

-- 77. Notification channel type category parameters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel_type_enum') THEN
        CREATE TYPE notification_channel_type_enum AS ENUM ('SMS', 'EMAIL', 'WHATSAPP', 'PUSH', 'IN_APP');
    END IF;
END $$;
COMMENT ON TYPE notification_channel_type_enum IS 'Supported communication carrier channels classification';

-- 78. Campaign execution lifecycle status values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_enum') THEN
        CREATE TYPE campaign_status_enum AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;
COMMENT ON TYPE campaign_status_enum IS 'Outbound announcement and marketing campaigns execution states';

-- 79. Message queuing transaction status parameter states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status_enum') THEN
        CREATE TYPE queue_status_enum AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRY_PENDING');
    END IF;
END $$;
COMMENT ON TYPE queue_status_enum IS 'Dispatch lifecycle queuing states';

-- 80. Actual message delivery metrics telemetry classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
        CREATE TYPE delivery_status_enum AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED', 'SPAM');
    END IF;
END $$;
COMMENT ON TYPE delivery_status_enum IS 'Outbound delivery receipt tracing status parameters';

-- 81. Target client device operating system platforms classification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_platform_enum') THEN
        CREATE TYPE device_platform_enum AS ENUM ('ANDROID', 'IOS', 'WEB');
    END IF;
END $$;
COMMENT ON TYPE device_platform_enum IS 'Client device hardware environment categorization';

-- 82. Portal announcements type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_type_enum') THEN
        CREATE TYPE announcement_type_enum AS ENUM ('GENERAL', 'HOLIDAY', 'EXAM_CIRCULAR', 'FEE_CIRCULAR', 'PLACEMENT');
    END IF;
END $$;
COMMENT ON TYPE announcement_type_enum IS 'Announcements importance categories';

-- 83. Communication configuration audit trail categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_audit_event_type_enum') THEN
        CREATE TYPE communication_audit_event_type_enum AS ENUM (
            'TEMPLATE_CREATED', 'TEMPLATE_UPDATED', 'VERSION_ARCHIVED', 'CAMPAIGN_LAUNCHED', 
            'PREFERENCE_UPDATED', 'DEVICE_REGISTERED', 'PROVIDER_TOGGLED', 'FAILOVER_TRIGGERED'
        );
    END IF;
END $$;
COMMENT ON TYPE communication_audit_event_type_enum IS 'Communication auditing events classification mappings';

-- 84. Dashboard target viewer roles classification enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dashboard_viewer_role_enum') THEN
        CREATE TYPE dashboard_viewer_role_enum AS ENUM ('PRINCIPAL', 'FACULTY', 'STUDENT', 'PARENT', 'FINANCE');
    END IF;
END $$;
COMMENT ON TYPE dashboard_viewer_role_enum IS 'Authorized roles mapping dashboard layouts';

-- 85. Dashboard display widget type classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'widget_type_enum') THEN
        CREATE TYPE widget_type_enum AS ENUM ('KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART', 'DATA_TABLE');
    END IF;
END $$;
COMMENT ON TYPE widget_type_enum IS 'Dashboard graphics and card widget formats';

-- 86. Generated analytical report document file formats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_format_enum') THEN
        CREATE TYPE report_format_enum AS ENUM ('PDF', 'CSV', 'XLSX');
    END IF;
END $$;
COMMENT ON TYPE report_format_enum IS 'Report download formats classification';

-- 87. Materialized analytical stats refresh jobs execution status parameters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refresh_job_status_enum') THEN
        CREATE TYPE refresh_job_status_enum AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
    END IF;
END $$;
COMMENT ON TYPE refresh_job_status_enum IS 'Execution states of analytics data pipeline rebuild jobs';

-- 88. Analytics and metric calculations audit trail event codes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_audit_event_enum') THEN
        CREATE TYPE analytics_audit_event_enum AS ENUM (
            'DASHBOARD_CREATED', 'WIDGET_CONFIGURED', 'REPORT_EXECUTED', 'KPI_REBUILT', 
            'STUDENT_ANALYTICS_MUTATED'
        );
    END IF;
END $$;
COMMENT ON TYPE analytics_audit_event_enum IS 'Analytical audit actions trace codes';

-- 89. Outbound AI request execution status parameters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_request_status_enum') THEN
        CREATE TYPE ai_request_status_enum AS ENUM ('SUCCESS', 'FAILED', 'TIMEOUT');
    END IF;
END $$;
COMMENT ON TYPE ai_request_status_enum IS 'Outbound model prompt executions state parameters';

-- 90. Chat message user/bot role classifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_role_enum') THEN
        CREATE TYPE chat_message_role_enum AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');
    END IF;
END $$;
COMMENT ON TYPE chat_message_role_enum IS 'Conversational thread messages role classifications';

-- 91. AI administrative audit action codes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_audit_event_enum') THEN
        CREATE TYPE ai_audit_event_enum AS ENUM (
            'PROVIDER_REGISTERED', 'MODEL_TOGGLED', 'PROMPT_UPDATED', 
            'CONVERSATION_ARCHIVED', 'REQUEST_LOGGED'
        );
    END IF;
END $$;
COMMENT ON TYPE ai_audit_event_enum IS 'AI model settings and templates audit trails events codes';
