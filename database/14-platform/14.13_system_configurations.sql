-- ============================================================================
-- SQL File: 14.13_system_configurations.sql
-- Domain: Global Platform Constant settings
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Configuration parameters settings (e.g. Max upload limits, OTP expiry ranges).
-- 2. Restricts config keys format codes via regex validations.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.system_configurations (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    config_key VARCHAR(100) NOT NULL, -- e.g. MAX_UPLOAD_SIZE_MB, OTP_EXPIRY_MINUTES
    config_value TEXT NOT NULL,
    
    description TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_sconf_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_sconf_key CHECK (config_key ~ '^[A-Z0-9_]{3,100}$'),
    CONSTRAINT chk_sconf_value CHECK (length(trim(config_value)) > 0),
    CONSTRAINT chk_sconf_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate system config keys per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sconf_tenant_key
    ON public.system_configurations(tenant_id, config_key)
    WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_system_configurations_touch_audit ON public.system_configurations;
CREATE TRIGGER trg_biu_system_configurations_touch_audit
    BEFORE INSERT OR UPDATE ON public.system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_system_configurations_policy ON public.system_configurations
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_system_configurations_policy ON public.system_configurations
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_system_configurations_policy ON public.system_configurations
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_system_configurations_policy ON public.system_configurations
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
