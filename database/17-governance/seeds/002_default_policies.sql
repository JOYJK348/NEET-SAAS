-- ============================================================================
-- File       : 002_default_policies.sql
-- Module     : Governance
-- Purpose    : Seed default platform policies with validation rules.
-- Depends On : policy_categories, policy_settings
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO policy_settings (tenant_id, category_code, policy_key, value, value_type, default_value, validation_rule, description, is_system, is_editable, tenant_override)
VALUES
    -- Security
    (NULL, 'security', 'security.password.min_length', '8', 'INTEGER', '8', '{"min": 6, "max": 128}', 'Minimum password length requirement', true, true, true),
    (NULL, 'security', 'security.password.require_uppercase', 'true', 'BOOLEAN', 'true', NULL, 'Require at least one uppercase letter', true, true, true),
    (NULL, 'security', 'security.password.require_special', 'true', 'BOOLEAN', 'true', NULL, 'Require at least one special character', true, true, true),
    (NULL, 'security', 'security.password.max_age_days', '90', 'INTEGER', '90', '{"min": 1, "max": 365}', 'Password expiry in days', true, true, true),
    (NULL, 'security', 'security.session.timeout_minutes', '60', 'INTEGER', '60', '{"min": 5, "max": 1440}', 'Idle session timeout in minutes', true, true, true),
    (NULL, 'security', 'security.mfa.enabled', 'false', 'BOOLEAN', 'false', NULL, 'Enforce multi-factor authentication', false, true, true),

    -- Authentication
    (NULL, 'authentication', 'authentication.otp.expiry_minutes', '5', 'INTEGER', '5', '{"min": 1, "max": 30}', 'OTP code expiry duration', true, true, true),
    (NULL, 'authentication', 'authentication.otp.max_attempts', '5', 'INTEGER', '5', '{"min": 1, "max": 10}', 'Maximum OTP verification attempts', true, true, true),
    (NULL, 'authentication', 'authentication.otp.resend_cooldown_seconds', '30', 'INTEGER', '30', '{"min": 10, "max": 300}', 'Cooldown before OTP resend', true, true, true),
    (NULL, 'authentication', 'authentication.login.max_attempts', '5', 'INTEGER', '5', '{"min": 1, "max": 20}', 'Login attempts before lockout', true, true, true),
    (NULL, 'authentication', 'authentication.login.lockout_minutes', '30', 'INTEGER', '30', '{"min": 1, "max": 1440}', 'Account lockout duration', true, true, true),

    -- Attendance
    (NULL, 'attendance', 'attendance.minimum_percentage', '75', 'INTEGER', '75', '{"min": 0, "max": 100}', 'Minimum attendance percentage required', false, true, true),
    (NULL, 'attendance', 'attendance.grace_period_minutes', '15', 'INTEGER', '15', '{"min": 0, "max": 60}', 'Late arrival grace period', false, true, true),

    -- Exam
    (NULL, 'exam', 'exam.max_attempts', '3', 'INTEGER', '3', '{"min": 1, "max": 10}', 'Maximum exam attempts allowed', false, true, true),
    (NULL, 'exam', 'exam.passing_percentage', '40', 'INTEGER', '40', '{"min": 0, "max": 100}', 'Minimum passing percentage', false, true, true),
    (NULL, 'exam', 'exam.duration_minutes', '180', 'INTEGER', '180', '{"min": 5, "max": 480}', 'Default exam duration in minutes', false, true, true),

    -- Rate Limits
    (NULL, 'platform', 'api.rate_limit.per_minute', '60', 'INTEGER', '60', '{"min": 1, "max": 1000}', 'API rate limit requests per minute', true, true, true),
    (NULL, 'platform', 'api.rate_limit.per_hour', '1000', 'INTEGER', '1000', '{"min": 1, "max": 100000}', 'API rate limit requests per hour', true, true, true)
ON CONFLICT (tenant_id, policy_key) DO NOTHING;
