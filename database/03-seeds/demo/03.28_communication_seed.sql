-- ============================================================================
-- SQL Seed File: 03.28_communication_seed.sql
-- Domain: Outbound templates, configurations, and campaigns logs seeding
-- ============================================================================

SET search_path = public;

-- 1. Seeding template configurations
INSERT INTO public.notification_templates (
    id, tenant_id, code, name, description, default_channel, fallback_channel, is_active
)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', -- ABC Tenant
    'FEE_DUE_REMINDER',
    'Student fee due notice template',
    'Dynamic alert templates sent before billing installment deadlines.',
    'EMAIL',
    'SMS',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Seeding template version markup
INSERT INTO public.notification_template_versions (
    id, tenant_id, notification_template_id, version_number, subject_template, body_template, is_approved, approved_by
)
VALUES (
    'a1000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001', -- Parent Template
    1,
    'Urgent: Fee installment payment due for ABC NEET Academy',
    'Dear {{student_name}}, your installment payment of {{due_amount}} is due on {{due_date}}. Please complete it to avoid late fee penalties.',
    true,
    '3b000000-0000-0000-0000-000000000013' -- Approved by staff
)
ON CONFLICT (id) DO NOTHING;

-- 3. Dynamic Variables Registry
INSERT INTO public.notification_variables (
    id, tenant_id, code, name, description, default_value
)
VALUES 
(
    'a1000000-0000-0000-0000-000000000101',
    'a0000000-0000-0000-0000-000000000001',
    'student_name',
    'Student Full Name',
    'Full name of target student admission profile',
    'Student'
),
(
    'a1000000-0000-0000-0000-000000000102',
    'a0000000-0000-0000-0000-000000000001',
    'due_amount',
    'Installment Due Amount',
    'Final target amount due to collect',
    '0.00'
),
(
    'a1000000-0000-0000-0000-000000000103',
    'a0000000-0000-0000-0000-000000000001',
    'due_date',
    'Installment Due Deadline Date',
    'Deadline date format',
    'today'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Email Provider Setup (SES Production Route)
INSERT INTO public.email_providers (
    id, tenant_id, code, name, api_endpoint, provider_config, is_active, priority
)
VALUES (
    'a1000000-0000-0000-0000-000000000201',
    'a0000000-0000-0000-0000-000000000001',
    'AWS_SES_PROD',
    'AWS SES Transactional gateway India',
    'https://email.ap-south-1.amazonaws.com',
    '{"access_key": "dummy_key", "region": "ap-south-1"}'::jsonb,
    true,
    1
)
ON CONFLICT (id) DO NOTHING;

-- 5. Outbound Messages Dispatch Queue
INSERT INTO public.notification_queue (
    id, tenant_id, notification_template_id, template_version_id, recipient_user_id, recipient_address,
    subject, body, channel_type, status, retry_count, max_retries, scheduled_send_at
)
VALUES (
    'a1000000-0000-0000-0000-000000000301',
    'a0000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001', -- Template
    'a1000000-0000-0000-0000-000000000011', -- Version
    '3b000000-0000-0000-0000-000000000100', -- Karthik R user profile ID
    'karthik.r@abcneet.com',
    'Urgent: Fee installment payment due for ABC NEET Academy',
    'Dear Karthik R, your installment payment of ₹37,240.00 is due on 2026-07-15. Please complete it to avoid late fee penalties.',
    'EMAIL',
    'PENDING',
    0,
    3,
    now()
)
ON CONFLICT (id) DO NOTHING;
