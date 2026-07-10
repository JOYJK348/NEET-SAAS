-- ============================================================================
-- SQL File: 11.18_webhook_events.sql
-- Domain: Webhook Events Ingestion Ledger (Shared platform integrations)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs raw inbound webhook events from telephony carriers (bounces, delivered, read status).
-- 2. Strictly append-only; updates and deletions are prevented via triggers.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    provider_name VARCHAR(50) NOT NULL, -- TWILIO, SENDGRID, METAPORTAL
    
    event_type VARCHAR(100) NOT NULL, -- e.g. email.delivered, sms.failed
    payload JSONB NOT NULL,
    
    processed_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_we_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_we_provider CHECK (length(trim(provider_name)) > 0),
    CONSTRAINT chk_we_event CHECK (length(trim(event_type)) > 0),
    CONSTRAINT chk_we_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_we_poller ON public.webhook_events(tenant_id, processed_status) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS uq_webhook_events_tenant_id CASCADE;
ALTER TABLE public.webhook_events ADD CONSTRAINT uq_webhook_events_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_webhook_events_touch_audit ON public.webhook_events;
CREATE TRIGGER trg_biu_webhook_events_touch_audit
    BEFORE INSERT OR UPDATE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on webhook logs)
CREATE OR REPLACE FUNCTION public.prevent_webhook_event_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Allow updating only status and processed_at
        IF (NEW.provider_name IS DISTINCT FROM OLD.provider_name) OR (NEW.payload IS DISTINCT FROM OLD.payload) THEN
            RAISE EXCEPTION 'Constraint Violation: Webhook payloads are immutable. Updates are forbidden.';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: Webhook records are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_webhook_event ON public.webhook_events;
CREATE TRIGGER trg_ud_prevent_webhook_event
    BEFORE UPDATE OR DELETE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_webhook_event_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_webhook_events_policy ON public.webhook_events
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_webhook_events_policy ON public.webhook_events
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_webhook_events_policy ON public.webhook_events
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_webhook_events_policy ON public.webhook_events
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
