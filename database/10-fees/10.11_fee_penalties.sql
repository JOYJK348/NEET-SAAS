-- ============================================================================
-- SQL File: 10.11_fee_penalties.sql
-- Domain: Fee Penalties Config rules (Pricing Master Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Configurations defining late fee penalty rules (Flat, or rate per day).
-- 2. Scopes maximum caps and grace threshold buffers.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_penalties (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Penalty parameters
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    flat_amount DECIMAL(12,2) NULL,
    amount_per_day DECIMAL(12,2) NULL,
    
    max_penalty_limit DECIMAL(12,2) NULL, -- Cap on accumulated penalty
    
    grace_days SMALLINT NOT NULL DEFAULT 0,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fpen_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fpen_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_fpen_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_fpen_value CHECK (
        (flat_amount IS NOT NULL AND amount_per_day IS NULL AND flat_amount > 0.00)
        OR (amount_per_day IS NOT NULL AND flat_amount IS NULL AND amount_per_day > 0.00)
    ),
    CONSTRAINT chk_fpen_max CHECK (max_penalty_limit IS NULL OR max_penalty_limit >= 0.00),
    CONSTRAINT chk_fpen_grace CHECK (grace_days >= 0),
    CONSTRAINT chk_fpen_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fpen_tenant_code
    ON public.fee_penalties(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_penalties DROP CONSTRAINT IF EXISTS uq_fee_penalties_tenant_id CASCADE;
ALTER TABLE public.fee_penalties ADD CONSTRAINT uq_fee_penalties_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_penalties_touch_audit ON public.fee_penalties;
CREATE TRIGGER trg_biu_fee_penalties_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_penalties
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_penalties_policy ON public.fee_penalties
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_penalties_policy ON public.fee_penalties
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_penalties_policy ON public.fee_penalties
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_penalties_policy ON public.fee_penalties
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Backward foreign key linking for circular dependency resolution
ALTER TABLE public.fee_installments DROP CONSTRAINT IF EXISTS fk_fi_late_fee_rule;
ALTER TABLE public.fee_installments ADD CONSTRAINT fk_fi_late_fee_rule 
    FOREIGN KEY (tenant_id, late_fee_rule_id) 
    REFERENCES public.fee_penalties(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;

