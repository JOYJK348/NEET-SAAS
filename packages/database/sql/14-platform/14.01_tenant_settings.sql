-- ============================================================================
-- SQL File: 14.01_tenant_settings.sql
-- Domain: Tenant Settings & Configurations (Aggregate Root)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Custom settings parameters (Locale, Currencies, Password policies) mapped per tenant.
-- 2. Restricts locale tags formats.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    locale VARCHAR(10) NOT NULL DEFAULT 'en-IN',
    
    -- Config groups
    branding_config JSONB NULL, -- logo URLs, colors keys
    password_policy JSONB NULL, -- min length, numeric checks overrides
    session_timeout_seconds INTEGER NOT NULL DEFAULT 3600,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ts_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_ts_currency CHECK (length(trim(currency)) > 0),
    CONSTRAINT chk_ts_locale CHECK (length(trim(locale)) > 0),
    CONSTRAINT chk_ts_session CHECK (session_timeout_seconds >= 60),
    CONSTRAINT chk_ts_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate settings records per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ts_tenant
    ON public.tenant_settings(tenant_id)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.tenant_settings DROP CONSTRAINT IF EXISTS uq_tenant_settings_tenant_id CASCADE;
ALTER TABLE public.tenant_settings ADD CONSTRAINT uq_tenant_settings_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_tenant_settings_touch_audit ON public.tenant_settings;
CREATE TRIGGER trg_biu_tenant_settings_touch_audit
    BEFORE INSERT OR UPDATE ON public.tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_tenant_settings_policy ON public.tenant_settings
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_tenant_settings_policy ON public.tenant_settings
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_tenant_settings_policy ON public.tenant_settings
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_tenant_settings_policy ON public.tenant_settings
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
