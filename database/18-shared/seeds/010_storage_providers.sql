-- ============================================================================
-- File       : 010_storage_providers.sql
-- Module     : Shared
-- Purpose    : Seed storage provider configurations.
-- Depends On : storage_providers
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO storage_providers (code, name, description, config_schema, priority, is_active)
VALUES
    ('supabase_storage', 'Supabase Storage', 'Built-in Supabase S3-compatible storage', '{"type": "object", "properties": {"bucket": {"type": "string"}, "public_url": {"type": "string"}}, "required": ["bucket"]}', 1, true),
    ('cloudflare_r2', 'Cloudflare R2', 'Cloudflare R2 object storage (S3-compatible)', '{"type": "object", "properties": {"account_id": {"type": "string"}, "bucket": {"type": "string"}, "access_key_id": {"type": "string"}, "secret_access_key": {"type": "string"}, "public_url": {"type": "string"}}, "required": ["account_id", "bucket", "access_key_id", "secret_access_key"]}', 2, true),
    ('aws_s3', 'AWS S3', 'Amazon Web Services S3 object storage', '{"type": "object", "properties": {"region": {"type": "string"}, "bucket": {"type": "string"}, "access_key_id": {"type": "string"}, "secret_access_key": {"type": "string"}, "public_url": {"type": "string"}}, "required": ["region", "bucket", "access_key_id", "secret_access_key"]}', 3, true),
    ('azure_blob', 'Azure Blob Storage', 'Microsoft Azure Blob Storage', '{"type": "object", "properties": {"connection_string": {"type": "string"}, "container": {"type": "string"}, "public_url": {"type": "string"}}, "required": ["connection_string", "container"]}', 4, true),
    ('google_cloud_storage', 'Google Cloud Storage', 'Google Cloud Storage bucket', '{"type": "object", "properties": {"project_id": {"type": "string"}, "bucket": {"type": "string"}, "service_account_key": {"type": "string"}, "public_url": {"type": "string"}}, "required": ["project_id", "bucket", "service_account_key"]}', 5, true)
ON CONFLICT (code) DO NOTHING;
