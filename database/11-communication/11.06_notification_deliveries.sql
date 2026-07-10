-- ============================================================================
-- SQL File: 11.06_notification_deliveries.sql
-- Domain: Outbound Message Delivery logs (Shared Core Engine)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs individual carrier delivery execution attempts (SMS providers, SendGrid).
-- 2. Scopes latency tracking, pricing costs, and provider message references.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_queue_id UUID NOT NULL,
    
    -- Routing details
    provider_name VARCHAR(50) NOT NULL, -- TWILIO, MSG91, SENDGRID, METAPORTAL
    provider_message_id VARCHAR(250) NULL,
    
    status delivery_status_enum NOT NULL DEFAULT 'PENDING',
    
    -- Telemetry
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    delivered_at TIMESTAMP WITH TIME ZONE NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    
    delivery_latency_ms INTEGER NULL, -- Latency calculation
    estimated_cost DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    
    provider_response JSONB NULL, -- Raw response tracking
    error_message TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ndel_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_ndel_queue FOREIGN KEY (tenant_id, notification_queue_id)
        REFERENCES public.notification_queue(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_ndel_cost CHECK (estimated_cost >= 0.0000),
    CONSTRAINT chk_ndel_latency CHECK (delivery_latency_ms IS NULL OR delivery_latency_ms >= 0),
    CONSTRAINT chk_ndel_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ndel_queue ON public.notification_deliveries(notification_queue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ndel_provider_ref ON public.notification_deliveries(provider_name, provider_message_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_deliveries DROP CONSTRAINT IF EXISTS uq_notification_deliveries_tenant_id CASCADE;
ALTER TABLE public.notification_deliveries ADD CONSTRAINT uq_notification_deliveries_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_deliveries_touch_audit ON public.notification_deliveries;
CREATE TRIGGER trg_biu_notification_deliveries_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_deliveries_policy ON public.notification_deliveries
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_deliveries_policy ON public.notification_deliveries
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_deliveries_policy ON public.notification_deliveries
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_deliveries_policy ON public.notification_deliveries
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
