-- ============================================================================
-- File       : 001_policy_categories.sql
-- Module     : Governance
-- Purpose    : Seed default policy categories.
-- Depends On : policy_categories
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO policy_categories (code, name, description, display_order, is_active)
VALUES
    ('security', 'Security', 'Authentication, password, session, and MFA policies', 1, true),
    ('authentication', 'Authentication', 'Login, OTP, SSO, and token policies', 2, true),
    ('attendance', 'Attendance', 'Attendance rules, thresholds, and grace periods', 3, true),
    ('exam', 'Exam', 'Exam attempt limits, duration, and passing criteria', 4, true),
    ('billing', 'Billing', 'Fee structure, payment terms, and invoice policies', 5, true),
    ('communication', 'Communication', 'Email, SMS, push notification rate limits', 6, true),
    ('ai', 'AI', 'AI feature limits, rate limits, and model selection', 7, true),
    ('platform', 'Platform', 'Platform-wide operational settings and limits', 8, true),
    ('notification', 'Notification', 'Notification delivery, retry, and throttling', 9, true)
ON CONFLICT (code) DO NOTHING;
