-- ============================================================================
-- SQL File: 13.09_ai_usage_logs.sql
-- Domain: AI usage limits and token analytics context
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Summarizes daily tokens consumed by student/staff profiles to prevent abuse.
-- 2. Scopes date coordinates check constraints.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    user_id UUID NOT NULL, -- References public.users.id
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    tokens_consumed INTEGER NOT NULL DEFAULT 0,
    requests_count INTEGER NOT NULL DEFAULT 0,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_aul_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_aul_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_aul_tokens CHECK (tokens_consumed >= 0),
    CONSTRAINT chk_aul_requests CHECK (requests_count >= 0),
    CONSTRAINT chk_aul_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate daily user summaries logs
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_aul_user_date
    ON public.ai_usage_logs(tenant_id, user_id, usage_date)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_aul_user_date ON public.ai_usage_logs(user_id, usage_date) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_usage_logs_touch_audit ON public.ai_usage_logs;
CREATE TRIGGER trg_biu_ai_usage_logs_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_usage_logs_policy ON public.ai_usage_logs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_usage_logs_policy ON public.ai_usage_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_ai_usage_logs_policy ON public.ai_usage_logs
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_usage_logs_policy ON public.ai_usage_logs
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
