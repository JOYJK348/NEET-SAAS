-- ============================================================================
-- SQL File: 11.24_communication_rate_limits.sql
-- Domain: Outbound Message Rate Limits (Shared Platform protection)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Sets rate limits to protect outbound messaging lines from spam blocks.
-- 2. Scopes thresholds by template or channel code per tenant.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.communication_rate_limits (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    limit_scope VARCHAR(50) NOT NULL, -- GLOBAL, TEMPLATE, CHANNEL
    scope_target_code VARCHAR(100) NULL, -- e.g. STUDENT_ABSENT_REMINDER, WHATSAPP
    
    max_messages_allowed INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL, -- Time window in seconds (e.g. 60 for minutes, 3600 for hour)
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_crl_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_crl_scope CHECK (limit_scope IN ('GLOBAL', 'TEMPLATE', 'CHANNEL')),
    CONSTRAINT chk_crl_allowed CHECK (max_messages_allowed > 0),
    CONSTRAINT chk_crl_window CHECK (window_seconds > 0),
    CONSTRAINT chk_crl_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate rate limit scopes per target per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_crl_tenant_target
    ON public.communication_rate_limits(tenant_id, limit_scope, coalesce(scope_target_code, 'ALL'))
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.communication_rate_limits DROP CONSTRAINT IF EXISTS uq_communication_rate_limits_tenant_id CASCADE;
ALTER TABLE public.communication_rate_limits ADD CONSTRAINT uq_communication_rate_limits_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_communication_rate_limits_touch_audit ON public.communication_rate_limits;
CREATE TRIGGER trg_biu_communication_rate_limits_touch_audit
    BEFORE INSERT OR UPDATE ON public.communication_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.communication_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_communication_rate_limits_policy ON public.communication_rate_limits
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_communication_rate_limits_policy ON public.communication_rate_limits
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_communication_rate_limits_policy ON public.communication_rate_limits
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_communication_rate_limits_policy ON public.communication_rate_limits
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
