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






