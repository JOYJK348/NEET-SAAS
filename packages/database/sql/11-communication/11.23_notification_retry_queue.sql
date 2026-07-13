-- ============================================================================
-- SQL File: 11.23_notification_retry_queue.sql
-- Domain: Outbound Message Retry Management (Queue management)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Segregates failed notifications from the main fast poller queue.
-- 2. Implements exponential backoff calculation variables.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_retry_queue (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_queue_id UUID NOT NULL,
    
    -- Retry tracking parameters
    attempt_number SMALLINT NOT NULL DEFAULT 1,
    next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    last_error TEXT NULL,
    backoff_multiplier DECIMAL(3,1) NOT NULL DEFAULT 2.0, -- Multiplier for backoffs
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_nrq_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_nrq_queue FOREIGN KEY (tenant_id, notification_queue_id)
        REFERENCES public.notification_queue(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_nrq_attempts CHECK (attempt_number > 0),
    CONSTRAINT chk_nrq_backoff CHECK (backoff_multiplier >= 1.0),
    CONSTRAINT chk_nrq_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_nrq_queue ON public.notification_retry_queue(notification_queue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nrq_poller ON public.notification_retry_queue(tenant_id, next_attempt_at) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_retry_queue_touch_audit ON public.notification_retry_queue;
CREATE TRIGGER trg_biu_notification_retry_queue_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_retry_queue
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_retry_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_retry_queue_policy ON public.notification_retry_queue
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_retry_queue_policy ON public.notification_retry_queue
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_retry_queue_policy ON public.notification_retry_queue
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_retry_queue_policy ON public.notification_retry_queue
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
