-- ============================================================================
-- SQL Seed File: 03.30_ai_seed.sql
-- Domain: AI Provider models configs, chat history logs seeding
-- ============================================================================

SET search_path = public;

-- 1. AI Provider Seed (DeepSeek)
INSERT INTO public.ai_providers (
    id, tenant_id, code, name, api_endpoint, provider_config, is_active, priority
)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', -- ABC Tenant
    'DEEPSEEK',
    'DeepSeek LLM Gateway API',
    'https://api.deepseek.com',
    '{"api_key_vault_ref": "secret/deepseek"}'::jsonb,
    true,
    1
)
ON CONFLICT (id) DO NOTHING;

-- 2. AI Model Profile Seed (DeepSeek Chat/Reasoner V3)
INSERT INTO public.ai_models (
    id, tenant_id, ai_provider_id, code, name, context_window_tokens, input_token_price_usd, output_token_price_usd, is_active
)
VALUES (
    'd0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001', -- DeepSeek provider
    'DEEPSEEK_CHAT',
    'DeepSeek Chat Reasoner V3',
    64000,
    0.1400,
    0.2800,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. AI Prompts template manager setup
INSERT INTO public.ai_prompts (
    id, tenant_id, code, name, description, system_prompt, user_template, version_number, is_active
)
VALUES (
    'd0000000-0000-0000-0000-000000000101',
    'a0000000-0000-0000-0000-000000000001',
    'EXPLAIN_QUESTION',
    'Explain NEET MCQ Question Prompts Template',
    'Calibrated prompt for explaining complex physics/chemistry questions.',
    'You are an expert NEET Medical entrance coach. Explain the question step-by-step focusing on core scientific principles.',
    'Question: {{question_body}}',
    1,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Dynamic chat conversation thread (Karthik R user session)
INSERT INTO public.ai_conversations (
    id, tenant_id, user_id, title, is_archived
)
VALUES (
    'd0000000-0000-0000-0000-000000000201',
    'a0000000-0000-0000-0000-000000000001',
    '3b000000-0000-0000-0000-000000000100', -- Karthik R User profile ID
    'Explaining Cellular Mitosis steps',
    false
)
ON CONFLICT (id) DO NOTHING;

-- 5. Chat message logs trace
INSERT INTO public.ai_messages (
    id, tenant_id, ai_conversation_id, role, content, tokens_consumed, response_time_ms
)
VALUES 
(
    'd0000000-0000-0000-0000-000000000301',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000201', -- Conversation
    'USER',
    'Explain the differences between Mitosis and Meiosis.',
    120,
    NULL
),
(
    'd0000000-0000-0000-0000-000000000302',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000201', -- Conversation
    'ASSISTANT',
    'Mitosis occurs in somatic cells producing two diploid cells, whereas Meiosis occurs in germ cells producing four haploid gametes.',
    350,
    1200
)
ON CONFLICT (id) DO NOTHING;
