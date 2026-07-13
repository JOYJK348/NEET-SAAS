-- ============================================================================
-- File       : 004_system_settings.sql
-- Module     : Governance
-- Purpose    : Seed platform-level system settings.
-- Depends On : system_settings
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO system_settings (setting_key, value, value_type, description, is_encrypted, is_public)
VALUES
    ('platform.maintenance_mode', to_jsonb(false), 'BOOLEAN', 'Enable maintenance mode (blocks all non-admin access)', false, true),
    ('platform.timezone', to_jsonb('Asia/Kolkata'::TEXT), 'STRING', 'Default platform timezone', false, true),
    ('platform.brand_name', to_jsonb('Agaran'::TEXT), 'STRING', 'Platform brand/display name', false, true),
    ('platform.brand_logo_url', to_jsonb(''::TEXT), 'URL', 'Brand logo URL for UI and emails', false, true),
    ('platform.support_email', to_jsonb('support@agaran.com'::TEXT), 'EMAIL', 'Customer support email address', false, true),
    ('platform.support_phone', to_jsonb(''::TEXT), 'STRING', 'Customer support phone number', false, false),
    ('platform.default_language', to_jsonb('en'::TEXT), 'STRING', 'Default UI language code', false, true),
    ('platform.session.encryption_key', to_jsonb(''::TEXT), 'STRING', 'Application-level encryption key for sensitive data', true, false),
    ('platform.audit.retention_days', to_jsonb(365), 'INTEGER', 'Audit log retention period in days', false, false),
    ('platform.maintenance.message', to_jsonb('System is under maintenance. Please try again later.'::TEXT), 'STRING', 'Maintenance mode banner message', false, true)
ON CONFLICT (setting_key) DO NOTHING;
