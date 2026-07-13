-- ============================================================================
-- File       : 007_file_types.sql
-- Module     : Shared
-- Purpose    : Logical file category classification.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS file_types CASCADE;

CREATE TABLE file_types (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_size_bytes BIGINT,
    allowed_mime_categories TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_file_types_code CHECK (code ~ '^[A-Z][A-Z_]{1,29}$'),
    CONSTRAINT chk_file_types_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_file_types_version CHECK (version > 0)
);

COMMENT ON TABLE file_types IS 'Logical file categories for upload validation and storage policies.';
COMMENT ON COLUMN file_types.allowed_mime_categories IS 'Array of allowed MIME type categories (e.g. {image, video, document}).';
