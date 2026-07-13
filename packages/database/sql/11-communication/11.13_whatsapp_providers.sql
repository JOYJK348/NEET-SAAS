-- ============================================================================
-- SQL File: 11.13_whatsapp_providers.sql
-- Domain: WhatsApp Business API providers Registry (Provider Master Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Registry catalog config for WhatsApp providers (Meta API, Gupshup, Interakt).
-- 2. Embeds configuration details references.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.whatsapp_providers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. META_BUSINESS, GUPSHUP
    name VARCHAR(100) NOT NULL,
    
    api_endpoint VARCHAR(250) NULL,
    provider_config JSONB NULL, -- Key-value configurations
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority SMALLINT NOT NULL DEFAULT 1,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_wprov_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_wprov_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_wprov_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_wprov_priority CHECK (priority > 0),
    CONSTRAINT chk_wprov_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_wprov_tenant_code
    ON public.whatsapp_providers(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.whatsapp_providers DROP CONSTRAINT IF EXISTS uq_whatsapp_providers_tenant_id CASCADE;
ALTER TABLE public.whatsapp_providers ADD CONSTRAINT uq_whatsapp_providers_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_whatsapp_whatsapp_providers_touch_audit ON public.whatsapp_providers;
CREATE TRIGGER trg_biu_whatsapp_whatsapp_providers_touch_audit
    BEFORE INSERT OR UPDATE ON public.whatsapp_providers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.whatsapp_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_whatsapp_providers_policy ON public.whatsapp_providers
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_whatsapp_providers_policy ON public.whatsapp_providers
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_whatsapp_providers_policy ON public.whatsapp_providers
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_whatsapp_providers_policy ON public.whatsapp_providers
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
