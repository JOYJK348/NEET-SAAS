-- ============================================================================
-- File       : 003_feature_flags.sql
-- Module     : Governance
-- Purpose    : Seed default feature flags for platform modules.
-- Depends On : feature_flags
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO feature_flags (tenant_id, feature_key, enabled, rollout_percentage, plan_required, beta, internal, description)
VALUES
    -- Core platform features
    (NULL, 'ai.tutor', false, 100, 'PREMIUM', true, false, 'AI-powered tutoring assistant'),
    (NULL, 'ai.question_generator', false, 100, 'ENTERPRISE', true, false, 'AI question bank generation'),
    (NULL, 'whatsapp.notifications', false, 100, 'PREMIUM', false, false, 'WhatsApp notification integration'),
    (NULL, 'live.class', true, 100, NULL, false, false, 'Live class streaming capability'),
    (NULL, 'cbt.exam', true, 100, NULL, false, false, 'Computer-based testing'),
    (NULL, 'analytics.dashboard', true, 100, 'PREMIUM', false, false, 'Advanced analytics dashboards'),
    (NULL, 'analytics.reports', true, 100, 'PREMIUM', false, false, 'Custom report builder'),
    (NULL, 'sms.notifications', true, 100, NULL, false, false, 'SMS notification delivery'),
    (NULL, 'email.notifications', true, 100, NULL, false, false, 'Email notification delivery'),
    (NULL, 'push.notifications', true, 100, NULL, false, false, 'Push notification delivery'),
    (NULL, 'multi_language', true, 100, NULL, false, false, 'Multi-language UI support'),
    (NULL, 'offline.access', false, 50, 'PREMIUM', true, false, 'Offline content access'),
    (NULL, 'parents.portal', true, 100, NULL, false, false, 'Parent self-service portal'),
    (NULL, 'bulk.import', true, 100, 'PREMIUM', false, false, 'Bulk CSV/Excel data import'),
    (NULL, 'api.public', false, 100, 'ENTERPRISE', true, false, 'Public REST API access')
ON CONFLICT (tenant_id, feature_key) DO NOTHING;
