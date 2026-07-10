-- ============================================================================
-- SQL File: 11.04_notification_campaign_targets.sql
-- Domain: Outbound Broadcasting Campaigns Targets (Recipient Mapping)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Links recipient targets (students, parents, staff) to a campaign broadcast.
-- 2. Integrates JSONB parameters for specific personalized message substitutions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_campaign_targets (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_campaign_id UUID NOT NULL,
    
    -- Recipient Context
    recipient_user_id UUID NOT NULL, -- References public.users.id
    
    -- Substitutions mapping parameters
    -- e.g. {"custom_salutation": "Mr. Karthik", "score": 710}
    recipient_variables JSONB NULL,
    
    is_processed BOOLEAN NOT NULL DEFAULT false,
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
    CONSTRAINT fk_nct_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_nct_campaign FOREIGN KEY (tenant_id, notification_campaign_id)
        REFERENCES public.notification_campaigns(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_nct_recipient FOREIGN KEY (recipient_user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_nct_processing CHECK (
        (is_processed = false AND processed_at IS NULL)
        OR (is_processed = true AND processed_at IS NOT NULL)
    ),
    CONSTRAINT chk_nct_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate recipients within the same campaign
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_nct_campaign_recipient
    ON public.notification_campaign_targets(tenant_id, notification_campaign_id, recipient_user_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_nct_campaign ON public.notification_campaign_targets(notification_campaign_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nct_recipient ON public.notification_campaign_targets(recipient_user_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_campaign_targets_touch_audit ON public.notification_campaign_targets;
CREATE TRIGGER trg_biu_notification_campaign_targets_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_campaign_targets
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_campaign_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_campaign_targets_policy ON public.notification_campaign_targets
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_campaign_targets_policy ON public.notification_campaign_targets
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_campaign_targets_policy ON public.notification_campaign_targets
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_campaign_targets_policy ON public.notification_campaign_targets
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
