-- ============================================================================
-- File       : 008_notification_channels.sql
-- Module     : Shared
-- Purpose    : Seed notification channel types.
-- Depends On : notification_channels
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO notification_channels (code, name, description, supports_attachments, supports_templates, max_body_size, display_order)
VALUES
    ('EMAIL', 'Email', 'Email delivery via SMTP or transactional email service', true, true, 10485760, 1),
    ('SMS', 'SMS', 'Text message delivery via SMS gateway', false, true, 1600, 2),
    ('WHATSAPP', 'WhatsApp', 'WhatsApp Business API message delivery', true, true, 102400, 3),
    ('PUSH', 'Push Notification', 'Mobile push notification via FCM/APNs', false, true, 4096, 4),
    ('IN_APP', 'In-App Notification', 'In-app notification center', true, true, 65536, 5),
    ('WEBHOOK', 'Webhook', 'HTTP webhook callback delivery', true, true, 52428800, 6)
ON CONFLICT (code) DO NOTHING;
