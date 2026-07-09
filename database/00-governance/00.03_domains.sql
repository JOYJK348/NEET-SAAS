-- ============================================================================
-- SQL File: 00.03_domains.sql
-- Domain: Reusable Validation Domains
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Create domains only for high-reuse structural patterns (>= 5 tables).
-- 2. Avoid over-constraining values (e.g. basic position checks on email).
-- 3. Use CITEXT for email to enforce case-insensitive uniqueness natively.
-- 4. Added geolocation coordinate types (latitude, longitude) for attendance geofencing checks.
-- 5. Added color_hex for UI dashboards themes mapping configurations.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Case-insensitive email address validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_address') THEN
        CREATE DOMAIN email_address AS CITEXT
        CONSTRAINT chk_email_pattern CHECK (position('@' in VALUE) > 1 AND length(VALUE) <= 255);
    END IF;
END $$;
COMMENT ON DOMAIN email_address IS 'Case-insensitive validated email address format';

-- 2. Lenient global phone number format validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phone_number') THEN
        CREATE DOMAIN phone_number AS VARCHAR(20)
        CONSTRAINT chk_phone_pattern CHECK (VALUE ~ '^\+?[1-9]\d{1,14}$');
    END IF;
END $$;
COMMENT ON DOMAIN phone_number IS 'Global format phone number containing country code prefix';

-- 3. Standard percentages boundaries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'percentage') THEN
        CREATE DOMAIN percentage AS NUMERIC(5,2)
        CONSTRAINT chk_percentage_bounds CHECK (VALUE BETWEEN 0.00 AND 100.00);
    END IF;
END $$;
COMMENT ON DOMAIN percentage IS 'Standard decimal percentage restricted between 0 and 100';

-- 4. Positive ledger values limits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'positive_amount') THEN
        CREATE DOMAIN positive_amount AS NUMERIC(12,2)
        CONSTRAINT chk_amount_positive CHECK (VALUE >= 0.00);
    END IF;
END $$;
COMMENT ON DOMAIN positive_amount IS 'Positive numeric monetary values checks';

-- 5. Standard ISO 4217 currency identifiers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_code') THEN
        CREATE DOMAIN currency_code AS CHAR(3)
        CONSTRAINT chk_currency_uppercase CHECK (VALUE ~ '^[A-Z]{3}$');
    END IF;
END $$;
COMMENT ON DOMAIN currency_code IS 'Standard uppercase ISO 4217 currency codes identifiers';

-- 6. Geolocation Coordinate Latitude validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'latitude') THEN
        CREATE DOMAIN latitude AS NUMERIC(9,6)
        CONSTRAINT chk_latitude_range CHECK (VALUE BETWEEN -90.000000 AND 90.000000);
    END IF;
END $$;
COMMENT ON DOMAIN latitude IS 'Global geographic latitude coordinate checks';

-- 7. Geolocation Coordinate Longitude validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'longitude') THEN
        CREATE DOMAIN longitude AS NUMERIC(9,6)
        CONSTRAINT chk_longitude_range CHECK (VALUE BETWEEN -180.000000 AND 180.000000);
    END IF;
END $$;
COMMENT ON DOMAIN longitude IS 'Global geographic longitude coordinate checks';

-- 8. UI Themes Color Hex validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'color_hex') THEN
        CREATE DOMAIN color_hex AS CHAR(7)
        CONSTRAINT chk_color_hex_pattern CHECK (VALUE ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;
COMMENT ON DOMAIN color_hex IS 'Valid UI hexadecimal color code format (#RRGGBB)';

