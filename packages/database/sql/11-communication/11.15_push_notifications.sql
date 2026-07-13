-- ============================================================================
-- SQL File: 11.15_push_notifications.sql
-- Domain: Push notifications logs (Device Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Traces push notification delivery states per target device ID.
-- 2. Logs open, click, and dismiss tracking states.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.push_notifications (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    push_device_id UUID NOT NULL,
    
    -- Content details
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    click_action VARCHAR(250) NULL, -- Link to open
    
    -- Telemetry
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    opened_at TIMESTAMP WITH TIME ZONE NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NULL,
    
    is_delivered BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pnot_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_pnot_device FOREIGN KEY (tenant_id, push_device_id)
        REFERENCES public.push_devices(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_pnot_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_pnot_body CHECK (length(trim(body)) > 0),
    CONSTRAINT chk_pnot_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pnot_device ON public.push_notifications(push_device_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_push_notifications_touch_audit ON public.push_notifications;
CREATE TRIGGER trg_biu_push_notifications_touch_audit
    BEFORE INSERT OR UPDATE ON public.push_notifications
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_push_notifications_policy ON public.push_notifications
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_push_notifications_policy ON public.push_notifications
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_push_notifications_policy ON public.push_notifications
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_push_notifications_policy ON public.push_notifications
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
