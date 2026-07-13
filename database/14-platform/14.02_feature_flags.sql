-- ============================================================================
-- SQL File: 14.02_feature_flags.sql
-- Domain: Modular Feature Toggles Registry
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Tracks features activation configurations (e.g. AI_TUTOR, HOSTEL) per tenant.
-- 2. Restricts flag code structure via regex validation checks.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. AI_TUTOR, LIVE_CLASSES, TRANSPORT
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Dynamic rollout attributes
    rollout_percentage SMALLINT NULL, -- Null implies 100% switch
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ff_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_ff_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_ff_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_ff_rollout CHECK (rollout_percentage IS NULL OR rollout_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_ff_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ff_tenant_code
    ON public.feature_flags(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_feature_flags_touch_audit ON public.feature_flags;
CREATE TRIGGER trg_biu_feature_flags_touch_audit
    BEFORE INSERT OR UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_feature_flags_policy ON public.feature_flags
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_feature_flags_policy ON public.feature_flags
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_feature_flags_policy ON public.feature_flags
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_feature_flags_policy ON public.feature_flags
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
