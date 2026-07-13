-- ============================================================================
-- SQL File: 11.25_provider_failovers.sql
-- Domain: Gateway Provider Failover Route Settings
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Automatic routing settings registry to switch routes when a gateway goes down.
-- 2. Pairs primary provider sources to destination fallback provider routes.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.provider_failovers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    channel_type notification_channel_type_enum NOT NULL,
    
    primary_provider_id UUID NOT NULL,
    fallback_provider_id UUID NOT NULL,
    
    -- Parameters
    consecutive_failures_threshold SMALLINT NOT NULL DEFAULT 5,
    is_triggered BOOLEAN NOT NULL DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pf_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_pf_providers CHECK (primary_provider_id IS DISTINCT FROM fallback_provider_id),
    CONSTRAINT chk_pf_threshold CHECK (consecutive_failures_threshold > 0),
    CONSTRAINT chk_pf_trigger CHECK (
        (is_triggered = false AND triggered_at IS NULL)
        OR (is_triggered = true AND triggered_at IS NOT NULL)
    ),
    CONSTRAINT chk_pf_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pf_poller ON public.provider_failovers(tenant_id, channel_type) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_provider_failovers_touch_audit ON public.provider_failovers;
CREATE TRIGGER trg_biu_provider_failovers_touch_audit
    BEFORE INSERT OR UPDATE ON public.provider_failovers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.provider_failovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_provider_failovers_policy ON public.provider_failovers
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_provider_failovers_policy ON public.provider_failovers
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_provider_failovers_policy ON public.provider_failovers
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_provider_failovers_policy ON public.provider_failovers
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
