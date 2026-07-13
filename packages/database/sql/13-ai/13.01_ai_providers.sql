-- ============================================================================
-- SQL File: 13.01_ai_providers.sql
-- Domain: LLM Providers Configuration (Aggregate Root)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Configuration templates for LLM providers (OpenAI, Anthropic, Gemini).
-- 2. Restricts priority scales, rate limits parameters.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. OPENAI, ANTHROPIC, GEMINI, DEEPSEEK
    name VARCHAR(100) NOT NULL,
    
    api_endpoint VARCHAR(250) NULL,
    provider_config JSONB NULL, -- Key-value configurations (API Key refs, organization IDs)
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority SMALLINT NOT NULL DEFAULT 1,
    
    -- Rate limits (global scope per provider)
    max_requests_per_minute INTEGER NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_aprov_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_aprov_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_aprov_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_aprov_priority CHECK (priority > 0),
    CONSTRAINT chk_aprov_limits CHECK (max_requests_per_minute IS NULL OR max_requests_per_minute > 0),
    CONSTRAINT chk_aprov_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate provider configurations per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_aprov_tenant_code
    ON public.ai_providers(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_providers DROP CONSTRAINT IF EXISTS uq_ai_providers_tenant_id CASCADE;
ALTER TABLE public.ai_providers ADD CONSTRAINT uq_ai_providers_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_providers_touch_audit ON public.ai_providers;
CREATE TRIGGER trg_biu_ai_providers_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_providers_policy ON public.ai_providers
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_providers_policy ON public.ai_providers
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_ai_providers_policy ON public.ai_providers
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_providers_policy ON public.ai_providers
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
