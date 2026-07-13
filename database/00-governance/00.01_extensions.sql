-- ============================================================================
-- SQL File: 00.01_extensions.sql
-- Domain: Database Initialization Setup
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "pgcrypto": For cryptographic primitives (salt hashes) and gen_random_uuid().
-- 2. "pg_trgm": Accelerates fuzzy search indices (trigram based queries).
-- 3. "btree_gist": Mandatory to enable overlap exclusion constraints (EXCLUDE USING gist) 
--    across timetables, calendar schedules, and salary timelines.
-- 4. "citext": Case-insensitive character string type for emails and unique usernames.
-- 
-- Compatibility:
-- - PostgreSQL versions without native UUIDv7 use gen_random_uuid() from pgcrypto.
-- - Native UUIDv7 can be adopted when supported by the target PostgreSQL version.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- Activate extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Catalog audits descriptions
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions and UUID generation';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram similarity search';
COMMENT ON EXTENSION "btree_gist" IS 'Supports exclusion constraints';
COMMENT ON EXTENSION "citext" IS 'Case-insensitive text data type';


