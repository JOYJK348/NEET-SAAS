-- ============================================================================
-- File       : 007_mime_types.sql
-- Module     : Shared
-- Purpose    : Seed common MIME types mapped to file type categories.
-- Depends On : mime_types, file_types
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO mime_types (mime_type, file_type_code, extension, category)
VALUES
    -- Image
    ('image/jpeg', 'IMAGE', '.jpg', 'image'),
    ('image/png', 'IMAGE', '.png', 'image'),
    ('image/gif', 'IMAGE', '.gif', 'image'),
    ('image/webp', 'IMAGE', '.webp', 'image'),
    ('image/svg+xml', 'IMAGE', '.svg', 'image'),
    ('image/bmp', 'IMAGE', '.bmp', 'image'),
    ('image/tiff', 'IMAGE', '.tiff', 'image'),
    ('image/heic', 'IMAGE', '.heic', 'image'),
    ('image/avif', 'IMAGE', '.avif', 'image'),
    -- Video
    ('video/mp4', 'VIDEO', '.mp4', 'video'),
    ('video/webm', 'VIDEO', '.webm', 'video'),
    ('video/ogg', 'VIDEO', '.ogv', 'video'),
    ('video/x-msvideo', 'VIDEO', '.avi', 'video'),
    ('video/quicktime', 'VIDEO', '.mov', 'video'),
    ('video/x-matroska', 'VIDEO', '.mkv', 'video'),
    ('video/mpeg', 'VIDEO', '.mpeg', 'video'),
    -- Audio
    ('audio/mpeg', 'AUDIO', '.mp3', 'audio'),
    ('audio/ogg', 'AUDIO', '.ogg', 'audio'),
    ('audio/wav', 'AUDIO', '.wav', 'audio'),
    ('audio/webm', 'AUDIO', '.weba', 'audio'),
    ('audio/aac', 'AUDIO', '.aac', 'audio'),
    ('audio/flac', 'AUDIO', '.flac', 'audio'),
    -- Document
    ('text/plain', 'DOCUMENT', '.txt', 'text'),
    ('text/html', 'DOCUMENT', '.html', 'text'),
    ('text/csv', 'SPREADSHEET', '.csv', 'text'),
    ('text/markdown', 'DOCUMENT', '.md', 'text'),
    ('application/rtf', 'DOCUMENT', '.rtf', 'application'),
    ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCUMENT', '.docx', 'document'),
    ('application/msword', 'DOCUMENT', '.doc', 'document'),
    -- PDF
    ('application/pdf', 'PDF', '.pdf', 'application'),
    -- Spreadsheet
    ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'SPREADSHEET', '.xlsx', 'application'),
    ('application/vnd.ms-excel', 'SPREADSHEET', '.xls', 'application'),
    ('application/vnd.oasis.opendocument.spreadsheet', 'SPREADSHEET', '.ods', 'application'),
    -- Archive
    ('application/zip', 'ARCHIVE', '.zip', 'archive'),
    ('application/x-rar-compressed', 'ARCHIVE', '.rar', 'archive'),
    ('application/gzip', 'ARCHIVE', '.gz', 'archive'),
    ('application/x-7z-compressed', 'ARCHIVE', '.7z', 'archive'),
    ('application/x-tar', 'ARCHIVE', '.tar', 'archive'),
    -- Data
    ('application/json', 'DATA', '.json', 'data'),
    ('application/xml', 'DATA', '.xml', 'data'),
    ('application/yaml', 'DATA', '.yaml', 'data'),
    -- Font
    ('font/ttf', 'FONT', '.ttf', 'font'),
    ('font/otf', 'FONT', '.otf', 'font'),
    ('font/woff', 'FONT', '.woff', 'font'),
    ('font/woff2', 'FONT', '.woff2', 'font')
ON CONFLICT (mime_type) DO NOTHING;
