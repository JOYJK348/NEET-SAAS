-- ============================================================================
-- SQL File: 11.08_notification_preferences.sql
-- Domain: User notification Preferences Configurations
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures user-specific channel toggle parameters (opt-in/opt-out states).
-- 2. Scopes settings by notification channel types.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    user_id UUID NOT NULL, -- References public.users.id
    
    channel_type notification_channel_type_enum NOT NULL,
    
    -- Toggles
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_npref_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_npref_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_npref_version CHECK (version > 0)
);

-- 2. Unique: only one preference setting mapping per channel per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_npref_user_channel
    ON public.notification_preferences(tenant_id, user_id, channel_type)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_npref_user ON public.notification_preferences(user_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_preferences_touch_audit ON public.notification_preferences;
CREATE TRIGGER trg_biu_notification_preferences_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_preferences_policy ON public.notification_preferences
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_preferences_policy ON public.notification_preferences
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_preferences_policy ON public.notification_preferences
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_preferences_policy ON public.notification_preferences
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
