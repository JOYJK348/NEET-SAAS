-- ============================================================================
-- SQL Seed File: 03.31_platform_seed.sql
-- Domain: Tenant defaults settings, feature flags, global constants seeding
-- ============================================================================

SET search_path = public;

-- 1. Tenant Default Settings
INSERT INTO public.tenant_settings (
    id, tenant_id, timezone, currency, locale, session_timeout_seconds
)
VALUES (
    'a1400000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', -- ABC Tenant
    'Asia/Kolkata',
    'INR',
    'en-IN',
    7200
)
ON CONFLICT (id) DO NOTHING;

-- 2. Feature Flags
INSERT INTO public.feature_flags (
    id, tenant_id, code, name, description, is_enabled
)
VALUES 
(
    'a1400000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'AI_TUTOR',
    'AI Tutor access switch flag',
    'Toggles AI Tutor sidebar chat canvas access.',
    true
),
(
    'a1400000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'LIVE_CLASSES',
    'Live teaching video stream switch flag',
    'Toggles Zoom/Meet video integrations endpoints.',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. System Configurations
INSERT INTO public.system_configurations (
    id, tenant_id, config_key, config_value, description
)
VALUES 
(
    'a1400000-0000-0000-0000-000000000101',
    'a0000000-0000-0000-0000-000000000001',
    'MAX_UPLOAD_SIZE_MB',
    '100',
    'Maximum size threshold allowed for study material uploads.'
),
(
    'a1400000-0000-0000-0000-000000000102',
    'a0000000-0000-0000-0000-000000000001',
    'OTP_EXPIRY_MINUTES',
    '10',
    'Valid duration interval for auth verification pins.'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Background Job
INSERT INTO public.background_jobs (
    id, tenant_id, job_type, status, priority, scheduled_run_at
)
VALUES (
    'a1400000-0000-0000-0000-000000000201',
    'a0000000-0000-0000-0000-000000000001',
    'GENERATE_REPORT',
    'PENDING',
    2,
    now()
)
ON CONFLICT (id) DO NOTHING;
