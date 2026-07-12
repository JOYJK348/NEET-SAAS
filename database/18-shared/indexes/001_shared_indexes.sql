-- ============================================================================
-- File       : 001_shared_indexes.sql
-- Module     : Shared
-- Purpose    : Unique and performance indexes for shared lookup tables.
-- Depends On : all shared tables
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- Most uniqueness is enforced via PK and inline UNIQUE constraints.
-- These indexes cover common query patterns.

-- 1. Country search by name
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries (name);

-- 2. States by country
CREATE INDEX IF NOT EXISTS idx_states_country ON states (country_id, name);

-- 3. Languages by name
CREATE INDEX IF NOT EXISTS idx_languages_name ON languages (name);

-- 4. MIME types by file type
CREATE INDEX IF NOT EXISTS idx_mime_types_file_type ON mime_types (file_type_code, mime_type);

-- 5. MIME types by extension
CREATE INDEX IF NOT EXISTS idx_mime_types_extension ON mime_types (extension);

-- 6. Error codes by module
CREATE INDEX IF NOT EXISTS idx_error_codes_module ON error_codes (module, code);

-- 7. Units of measure by category
CREATE INDEX IF NOT EXISTS idx_uom_category ON units_of_measure (category, code);

-- 8. Storage providers by priority
CREATE INDEX IF NOT EXISTS idx_storage_providers_priority ON storage_providers (priority, code)
    WHERE is_active = true;

-- 9. Phone codes by country
CREATE INDEX IF NOT EXISTS idx_phone_codes_country ON countries_phone_codes (country_id)
    WHERE is_active = true;

-- 10. Date formats by category
CREATE INDEX IF NOT EXISTS idx_date_formats_category ON date_formats (category, display_order)
    WHERE is_active = true;
