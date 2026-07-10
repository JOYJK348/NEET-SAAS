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
