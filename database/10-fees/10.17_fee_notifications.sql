-- ============================================================================
-- SQL File: 10.17_fee_notifications.sql
-- Domain: Outbound Invoices Reminder notifications Logs (Communication ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs SMS, WhatsApp, or email billing notifications dispatched.
-- 2. Scopes channels via fee_notification_channel_enum.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_notifications (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_installment_id UUID NOT NULL,
    
    -- Channel parameters
    notification_channel fee_notification_channel_enum NOT NULL DEFAULT 'EMAIL',
    recipient_address VARCHAR(250) NOT NULL, -- Phone number or Email address
    
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status fee_notification_status_enum NOT NULL DEFAULT 'PENDING',
    
    failure_reason TEXT NULL,
    retry_count SMALLINT NOT NULL DEFAULT 0,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fnot_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_fnot_installment FOREIGN KEY (tenant_id, student_fee_installment_id)
        REFERENCES public.student_fee_installments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_fnot_recipient CHECK (length(trim(recipient_address)) > 0),
    CONSTRAINT chk_fnot_retries CHECK (retry_count >= 0),
    CONSTRAINT chk_fnot_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fnot_installment ON public.fee_notifications(student_fee_installment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fnot_status ON public.fee_notifications(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_notifications DROP CONSTRAINT IF EXISTS uq_fee_notifications_tenant_id CASCADE;
ALTER TABLE public.fee_notifications ADD CONSTRAINT uq_fee_notifications_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_notifications_touch_audit ON public.fee_notifications;
CREATE TRIGGER trg_biu_fee_notifications_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_notifications
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_notifications_policy ON public.fee_notifications
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_notifications_policy ON public.fee_notifications
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_notifications_policy ON public.fee_notifications
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_notifications_policy ON public.fee_notifications
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
