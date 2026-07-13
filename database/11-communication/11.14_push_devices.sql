-- ============================================================================
-- SQL File: 11.14_push_devices.sql
-- Domain: Browser/Mobile push devices registry (Device Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Registry mapping user device tokens for push alerts (iOS, Android, Web).
-- 2. Scopes operating systems platforms via device_platform_enum.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.push_devices (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    user_id UUID NOT NULL, -- References public.users.id
    
    device_token VARCHAR(500) NOT NULL,
    platform device_platform_enum NOT NULL DEFAULT 'WEB',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_pd_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_pd_token CHECK (length(trim(device_token)) > 0),
    CONSTRAINT chk_pd_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate tokens per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_pd_user_token
    ON public.push_devices(tenant_id, user_id, device_token)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_pd_user ON public.push_devices(user_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.push_devices DROP CONSTRAINT IF EXISTS uq_push_devices_tenant_id CASCADE;
ALTER TABLE public.push_devices ADD CONSTRAINT uq_push_devices_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_push_devices_touch_audit ON public.push_devices;
CREATE TRIGGER trg_biu_push_devices_touch_audit
    BEFORE INSERT OR UPDATE ON public.push_devices
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_push_devices_policy ON public.push_devices
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_push_devices_policy ON public.push_devices
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_push_devices_policy ON public.push_devices
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_push_devices_policy ON public.push_devices
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
