-- ============================================================================
-- SQL File: 11.10_notification_logs.sql
-- Domain: Outbound Message trace delivery History (Audit ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs every sent notification trace mapping details for long term archiving.
-- 2. Strict append-only constraints; mutations raise database exceptions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_queue_id UUID NULL,
    recipient_user_id UUID NOT NULL, -- References public.users.id
    
    channel_type notification_channel_type_enum NOT NULL,
    recipient_address VARCHAR(250) NOT NULL,
    
    subject VARCHAR(250) NULL,
    body TEXT NOT NULL,
    
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_nlog_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_nlog_recipient FOREIGN KEY (recipient_user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_nlog_recipient CHECK (length(trim(recipient_address)) > 0),
    CONSTRAINT chk_nlog_body CHECK (length(trim(body)) > 0),
    CONSTRAINT chk_nlog_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_nlog_recipient ON public.notification_logs(recipient_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nlog_date ON public.notification_logs(sent_at) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_logs_touch_audit ON public.notification_logs;
CREATE TRIGGER trg_biu_notification_logs_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on logs)
CREATE OR REPLACE FUNCTION public.prevent_notification_log_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: Notification logs are append-only. Updates are forbidden.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: Notification logs are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_notification_log ON public.notification_logs;
CREATE TRIGGER trg_ud_prevent_notification_log
    BEFORE UPDATE OR DELETE ON public.notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_notification_log_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_logs_policy ON public.notification_logs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_logs_policy ON public.notification_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE/DELETE policies needed as triggers raise exceptions anyway
