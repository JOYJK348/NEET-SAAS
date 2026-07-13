-- ============================================================================
-- SQL File: 11.09_notification_subscriptions.sql
-- Domain: Notification Subscriptions Registry (Opt-In / Opt-Out Topics)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps user subscriptions to specific communication groups (Exam alerts, Placement notices).
-- 2. Restricts duplicate mappings per user per subscription topic.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    user_id UUID NOT NULL, -- References public.users.id
    
    topic_name VARCHAR(100) NOT NULL, -- e.g. EXAM_ALERTS, PLACEMENTS, MARKETING
    is_subscribed BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_nsub_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_nsub_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_nsub_topic CHECK (length(trim(topic_name)) > 0),
    CONSTRAINT chk_nsub_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate topics subscription mapping per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_nsub_user_topic
    ON public.notification_subscriptions(tenant_id, user_id, lower(trim(topic_name)))
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_nsub_user ON public.notification_subscriptions(user_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_subscriptions_touch_audit ON public.notification_subscriptions;
CREATE TRIGGER trg_biu_notification_subscriptions_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_subscriptions_policy ON public.notification_subscriptions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_subscriptions_policy ON public.notification_subscriptions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_subscriptions_policy ON public.notification_subscriptions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_subscriptions_policy ON public.notification_subscriptions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
