-- ============================================================================
-- SQL File: 13.06_ai_requests.sql
-- Domain: Outbound LLM API Request logs (Monitoring context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Traces outbound LLM payload execution details (OpenAI, Gemini).
-- 2. Scopes token metrics logs, latency metrics, and API error codes.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    ai_model_id UUID NOT NULL,
    
    -- Telemetry parameters
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
    
    execution_duration_ms INTEGER NULL,
    estimated_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
    
    status ai_request_status_enum NOT NULL DEFAULT 'SUCCESS',
    error_message TEXT NULL,
    
    triggered_by_user UUID NULL, -- References public.users.id
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_areq_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_areq_model FOREIGN KEY (tenant_id, ai_model_id)
        REFERENCES public.ai_models(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_areq_user FOREIGN KEY (triggered_by_user)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_areq_tokens CHECK (prompt_tokens >= 0 AND completion_tokens >= 0),
    CONSTRAINT chk_areq_duration CHECK (execution_duration_ms IS NULL OR execution_duration_ms >= 0),
    CONSTRAINT chk_areq_cost CHECK (estimated_cost_usd >= 0.000000),
    CONSTRAINT chk_areq_version CHECK (version > 0)
);

-- 2. Indexes for usage monitoring
CREATE INDEX IF NOT EXISTS idx_areq_model ON public.ai_requests(ai_model_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_areq_status ON public.ai_requests(status) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_requests DROP CONSTRAINT IF EXISTS uq_ai_requests_tenant_id CASCADE;
ALTER TABLE public.ai_requests ADD CONSTRAINT uq_ai_requests_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_requests_touch_audit ON public.ai_requests;
CREATE TRIGGER trg_biu_ai_requests_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_requests
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_requests_policy ON public.ai_requests
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_requests_policy ON public.ai_requests
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_ai_requests_policy ON public.ai_requests
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_requests_policy ON public.ai_requests
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
