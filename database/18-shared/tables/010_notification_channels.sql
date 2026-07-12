-- ============================================================================
-- File       : 010_notification_channels.sql
-- Module     : Shared
-- Purpose    : Notification channel types shared across all modules.
-- Depends On : none
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DROP TABLE IF EXISTS notification_channels CASCADE;

CREATE TABLE notification_channels (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    supports_attachments BOOLEAN NOT NULL DEFAULT false,
    supports_templates BOOLEAN NOT NULL DEFAULT true,
    max_body_size INT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    version INT NOT NULL DEFAULT 1,
    metadata JSONB,

    CONSTRAINT chk_notification_channels_code CHECK (code ~ '^[A-Z][A-Z_]{1,29}$'),
    CONSTRAINT chk_notification_channels_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_notification_channels_version CHECK (version > 0)
);

COMMENT ON TABLE notification_channels IS 'Delivery channel types for notifications (Email, SMS, WhatsApp, Push, In-App, Webhook).';
