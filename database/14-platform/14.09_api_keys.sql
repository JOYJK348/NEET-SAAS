-- ============================================================================
-- SQL File: 14.09_api_keys.sql
-- Domain: Gateway Credentials configurations (Vault Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Configurations database mapping keys/tokens references (Razorpay, OpenAI keys references).
-- 2. Never stores raw values (only names, vault references, masks).
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. RAZORPAY_PROD_KEY, OPENAI_API_KEY
    name VARCHAR(100) NOT NULL,
    
    key_vault_reference VARCHAR(250) NOT NULL, -- Reference pointer to secure vault (e.g. AWS Secrets Manager, Vault)
    key_masked VARCHAR(20) NOT NULL, -- e.g. "sk-proj-****"
    
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    last_used_at TIMESTAMP WITH TIME ZONE NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ak_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_ak_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_ak_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_ak_vault CHECK (length(trim(key_vault_reference)) > 0),
    CONSTRAINT chk_ak_masked CHECK (length(trim(key_masked)) > 0),
    CONSTRAINT chk_ak_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate keys codes per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ak_tenant_code
    ON public.api_keys(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_api_keys_touch_audit ON public.api_keys;
CREATE TRIGGER trg_biu_api_keys_touch_audit
    BEFORE INSERT OR UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_api_keys_policy ON public.api_keys
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_api_keys_policy ON public.api_keys
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_api_keys_policy ON public.api_keys
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_api_keys_policy ON public.api_keys
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
