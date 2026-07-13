-- ============================================================================
-- SQL File: 13.02_ai_models.sql
-- Domain: Model Profiles Catalog configurations
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Registry profile catalogs config (e.g. gpt-4o, gemini-2.5-pro).
-- 2. Embeds context window capacities, pricing per 1M tokens variables.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    ai_provider_id UUID NOT NULL,
    
    code VARCHAR(100) NOT NULL, -- e.g. GPT_4O, GEMINI_2_5_PRO
    name VARCHAR(150) NOT NULL,
    
    context_window_tokens INTEGER NOT NULL DEFAULT 8192,
    
    -- Billing metadata pricing per 1 million tokens
    input_token_price_usd DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    output_token_price_usd DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_am_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_am_provider FOREIGN KEY (tenant_id, ai_provider_id)
        REFERENCES public.ai_providers(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_am_code CHECK (code ~ '^[A-Z0-9_.-]{3,100}$'),
    CONSTRAINT chk_am_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_am_context CHECK (context_window_tokens > 0),
    CONSTRAINT chk_am_pricing CHECK (input_token_price_usd >= 0.0000 AND output_token_price_usd >= 0.0000),
    CONSTRAINT chk_am_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate models codes per provider per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_am_provider_code
    ON public.ai_models(tenant_id, ai_provider_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_models DROP CONSTRAINT IF EXISTS uq_ai_models_tenant_id CASCADE;
ALTER TABLE public.ai_models ADD CONSTRAINT uq_ai_models_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_models_touch_audit ON public.ai_models;
CREATE TRIGGER trg_biu_ai_models_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_models
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_models_policy ON public.ai_models
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_models_policy ON public.ai_models
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_ai_models_policy ON public.ai_models
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_models_policy ON public.ai_models
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
