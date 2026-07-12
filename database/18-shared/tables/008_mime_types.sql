-- ============================================================================
-- File       : 008_mime_types.sql
-- Module     : Shared
-- Purpose    : MIME type reference mapped to file types for upload validation.
-- Depends On : file_types
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS mime_types CASCADE;

CREATE TABLE mime_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mime_type VARCHAR(100) NOT NULL UNIQUE,
    file_type_code VARCHAR(30) NOT NULL REFERENCES file_types(code) ON UPDATE CASCADE ON DELETE RESTRICT,
    extension VARCHAR(20) NOT NULL,
    category VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_mime_types_format CHECK (mime_type ~ '^[a-z]+/[a-z0-9+.-]+$'),
    CONSTRAINT chk_mime_types_category CHECK (category IN ('image', 'video', 'audio', 'document', 'archive', 'data', 'font', 'text', 'application')),
    CONSTRAINT chk_mime_types_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_mime_types_version CHECK (version > 0)
);

COMMENT ON TABLE mime_types IS 'MIME type registry for file upload validation and content-type detection.';
