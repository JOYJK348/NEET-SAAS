-- ============================================================================
-- SQL File: 11.05_notification_queue.sql
-- Domain: Outbound Message dispatch Queuing Buffer (Shared Core Engine)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures all messages queued for dispatch (SMS, Email, WhatsApp, Push).
-- 2. Prevents performance blocks; decoupling queuing from synchronous gateways execution.
-- 3. Scopes queue status lifecycle via queue_status_enum (PENDING, PROCESSING, SENT, FAILED).
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_template_id UUID NULL,
    template_version_id UUID NULL, -- Optional tracking lock
    notification_campaign_id UUID NULL, -- Optional link if sent by bulk campaign
    
    -- Recipient routing coordinates
    recipient_user_id UUID NOT NULL, -- References public.users.id
    recipient_address VARCHAR(250) NOT NULL, -- Email address, Phone number, or Device Token
    
    -- Content details (resolved prior to queue ingestion or inside dispatch worker)
    subject VARCHAR(250) NULL,
    body TEXT NOT NULL,
    
    -- Telemetry configurations
    channel_type notification_channel_type_enum NOT NULL DEFAULT 'EMAIL',
    status queue_status_enum NOT NULL DEFAULT 'PENDING',
    
    retry_count SMALLINT NOT NULL DEFAULT 0,
    max_retries SMALLINT NOT NULL DEFAULT 3,
    
    scheduled_send_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_nq_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_nq_template FOREIGN KEY (tenant_id, notification_template_id)
        REFERENCES public.notification_templates(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_nq_campaign FOREIGN KEY (tenant_id, notification_campaign_id)
        REFERENCES public.notification_campaigns(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_nq_recipient FOREIGN KEY (recipient_user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_nq_recipient_address CHECK (length(trim(recipient_address)) > 0),
    CONSTRAINT chk_nq_body CHECK (length(trim(body)) > 0),
    CONSTRAINT chk_nq_retries CHECK (retry_count >= 0 AND max_retries >= 0 AND retry_count <= max_retries),
    CONSTRAINT chk_nq_times CHECK (sent_at IS NULL OR sent_at >= scheduled_send_at),
    CONSTRAINT chk_nq_version CHECK (version > 0)
);

-- 2. Indexes for batch processing workers polling
CREATE INDEX IF NOT EXISTS idx_nq_processing_poller 
    ON public.notification_queue(tenant_id, status, scheduled_send_at) 
    WHERE deleted_at IS NULL AND status IN ('PENDING', 'RETRY_PENDING');

CREATE INDEX IF NOT EXISTS idx_nq_campaign ON public.notification_queue(notification_campaign_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_queue DROP CONSTRAINT IF EXISTS uq_notification_queue_tenant_id CASCADE;
ALTER TABLE public.notification_queue ADD CONSTRAINT uq_notification_queue_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_queue_touch_audit ON public.notification_queue;
CREATE TRIGGER trg_biu_notification_queue_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_queue_policy ON public.notification_queue
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_queue_policy ON public.notification_queue
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_queue_policy ON public.notification_queue
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_queue_policy ON public.notification_queue
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Late-binding foreign keys to resolve circular load-order dependencies
ALTER TABLE public.notification_queue DROP CONSTRAINT IF EXISTS fk_nq_template_version;
ALTER TABLE public.notification_queue ADD CONSTRAINT fk_nq_template_version 
    FOREIGN KEY (tenant_id, template_version_id) 
    REFERENCES public.notification_template_versions(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;
