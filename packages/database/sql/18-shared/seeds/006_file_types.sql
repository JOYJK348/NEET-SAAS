-- ============================================================================
-- File       : 006_file_types.sql
-- Module     : Shared
-- Purpose    : Seed logical file type categories.
-- Depends On : file_types
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO file_types (code, name, description, max_size_bytes, allowed_mime_categories, display_order)
VALUES
    ('IMAGE', 'Image', 'Image files (photos, diagrams, signatures)', 10485760, ARRAY['image'], 1),
    ('VIDEO', 'Video', 'Video recordings and lectures', 524288000, ARRAY['video'], 2),
    ('AUDIO', 'Audio', 'Audio recordings and podcasts', 104857600, ARRAY['audio'], 3),
    ('DOCUMENT', 'Document', 'Documents, reports, and text files', 52428800, ARRAY['document', 'text', 'application'], 4),
    ('PDF', 'PDF', 'PDF documents', 52428800, ARRAY['application'], 5),
    ('SPREADSHEET', 'Spreadsheet', 'Excel, CSV, and data files', 26214400, ARRAY['application', 'text'], 6),
    ('ARCHIVE', 'Archive', 'ZIP, RAR, and compressed files', 209715200, ARRAY['archive'], 7),
    ('DATA', 'Data', 'JSON, XML, and structured data files', 52428800, ARRAY['application', 'data'], 8),
    ('FONT', 'Font', 'Font files for branding and UI', 5242880, ARRAY['font'], 9)
ON CONFLICT (code) DO NOTHING;
