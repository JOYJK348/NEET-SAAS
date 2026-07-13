-- ============================================================================
-- SQL File: 11.03_notification_campaigns.sql
-- Domain: Outbound Broadcasting Campaigns (Campaign context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Sets scheduling parameters for automated bulk communications campaigns.
-- 2. Links to a parent notification template to retrieve layout markup formats.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_template_id UUID NOT NULL,
    template_version_id UUID NULL, -- Optional lock to a specific layout version
    
    -- Campaign metadata
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    status campaign_status_enum NOT NULL DEFAULT 'DRAFT',
    
    -- Timings
    scheduled_at TIMESTAMP WITH TIME ZONE NULL,
    started_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ncamp_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_ncamp_template FOREIGN KEY (tenant_id, notification_template_id)
        REFERENCES public.notification_templates(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_ncamp_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_ncamp_times CHECK (
        (completed_at IS NULL OR started_at IS NOT NULL) AND
        (started_at IS NULL OR scheduled_at IS NOT NULL OR started_at >= created_at)
    ),
    CONSTRAINT chk_ncamp_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ncamp_template ON public.notification_campaigns(notification_template_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ncamp_status ON public.notification_campaigns(status) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_campaigns DROP CONSTRAINT IF EXISTS uq_notification_campaigns_tenant_id CASCADE;
ALTER TABLE public.notification_campaigns ADD CONSTRAINT uq_notification_campaigns_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_campaigns_touch_audit ON public.notification_campaigns;
CREATE TRIGGER trg_biu_notification_campaigns_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_campaigns_policy ON public.notification_campaigns
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_campaigns_policy ON public.notification_campaigns
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_campaigns_policy ON public.notification_campaigns
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_campaigns_policy ON public.notification_campaigns
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Late-binding foreign keys to resolve circular load-order dependencies
ALTER TABLE public.notification_campaigns DROP CONSTRAINT IF EXISTS fk_ncamp_template_version;
ALTER TABLE public.notification_campaigns ADD CONSTRAINT fk_ncamp_template_version 
    FOREIGN KEY (tenant_id, template_version_id) 
    REFERENCES public.notification_template_versions(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;
