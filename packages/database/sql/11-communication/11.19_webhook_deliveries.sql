-- ============================================================================
-- SQL File: 11.19_webhook_deliveries.sql
-- Domain: Inbound Webhook event processing telemetry (Integration Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Traces the processing loop and delivery status of ingested webhook events.
-- 2. Embeds processing error logs and status parameters.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    webhook_event_id UUID NOT NULL,
    
    attempts SMALLINT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING', -- PROCESSING, SUCCESS, FAILED
    
    error_log TEXT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_wd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_wd_event FOREIGN KEY (tenant_id, webhook_event_id)
        REFERENCES public.webhook_events(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_wd_attempts CHECK (attempts > 0),
    CONSTRAINT chk_wd_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_wd_event ON public.webhook_deliveries(webhook_event_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_webhook_deliveries_touch_audit ON public.webhook_deliveries;
CREATE TRIGGER trg_biu_webhook_deliveries_touch_audit
    BEFORE INSERT OR UPDATE ON public.webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_webhook_deliveries_policy ON public.webhook_deliveries
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_webhook_deliveries_policy ON public.webhook_deliveries
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_webhook_deliveries_policy ON public.webhook_deliveries
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_webhook_deliveries_policy ON public.webhook_deliveries
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
