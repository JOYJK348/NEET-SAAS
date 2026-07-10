-- ============================================================================
-- SQL File: 11.07_notification_channels.sql
-- Domain: Notification Carrier channels master (Shared Platform configuration)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Registry catalog for carrier channels (SMS, EMAIL, WHATSAPP, PUSH).
-- 2. Embeds configuration details like sender IDs, rate limit settings.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_channels (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    channel_type notification_channel_type_enum NOT NULL,
    code VARCHAR(50) NOT NULL, -- e.g. WHATSAPP_PROD, EMAIL_SES_MARKETING
    name VARCHAR(100) NOT NULL,
    
    -- Channel details
    sender_identity VARCHAR(150) NOT NULL, -- sender email address, SMS header, WA business ID
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    channel_config JSONB NULL, -- Port configs, custom headers, webhook tokens
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_nch_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_nch_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_nch_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_nch_sender CHECK (length(trim(sender_identity)) > 0),
    CONSTRAINT chk_nch_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate channel type codes per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_nch_tenant_code
    ON public.notification_channels(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_channels DROP CONSTRAINT IF EXISTS uq_notification_channels_tenant_id CASCADE;
ALTER TABLE public.notification_channels ADD CONSTRAINT uq_notification_channels_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_channels_touch_audit ON public.notification_channels;
CREATE TRIGGER trg_biu_notification_channels_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_channels
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_channels_policy ON public.notification_channels
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_channels_policy ON public.notification_channels
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_channels_policy ON public.notification_channels
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_channels_policy ON public.notification_channels
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
