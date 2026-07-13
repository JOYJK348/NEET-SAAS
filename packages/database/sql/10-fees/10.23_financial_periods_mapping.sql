-- ============================================================================
-- SQL File: 10.23_financial_periods_mapping.sql
-- Domain: Financial Period Mapping (Tax/Audit periods context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps transactions to tax fiscal periods.
-- 2. Validates boundaries with effective date range checks.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.financial_periods_mapping (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. FY_2026_2027
    name VARCHAR(100) NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    is_closed BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fpm_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fpm_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_fpm_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_fpm_dates CHECK (end_date > start_date),
    CONSTRAINT chk_fpm_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fpm_tenant_code
    ON public.financial_periods_mapping(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.financial_periods_mapping DROP CONSTRAINT IF EXISTS uq_financial_periods_mapping_tenant_id CASCADE;
ALTER TABLE public.financial_periods_mapping ADD CONSTRAINT uq_financial_periods_mapping_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_financial_periods_mapping_touch_audit ON public.financial_periods_mapping;
CREATE TRIGGER trg_biu_financial_periods_mapping_touch_audit
    BEFORE INSERT OR UPDATE ON public.financial_periods_mapping
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.financial_periods_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_financial_periods_mapping_policy ON public.financial_periods_mapping
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_financial_periods_mapping_policy ON public.financial_periods_mapping
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_financial_periods_mapping_policy ON public.financial_periods_mapping
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_financial_periods_mapping_policy ON public.financial_periods_mapping
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Late-binding foreign keys to resolve circular load-order dependencies
ALTER TABLE public.fee_payments DROP CONSTRAINT IF EXISTS fk_fp_center;
ALTER TABLE public.fee_payments ADD CONSTRAINT fk_fp_center 
    FOREIGN KEY (tenant_id, collection_center_id) 
    REFERENCES public.fee_collection_centers(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.fee_payments DROP CONSTRAINT IF EXISTS fk_fp_closure;
ALTER TABLE public.fee_payments ADD CONSTRAINT fk_fp_closure 
    FOREIGN KEY (tenant_id, closure_id) 
    REFERENCES public.fee_collection_closures(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.fee_payments DROP CONSTRAINT IF EXISTS fk_fp_financial_period;
ALTER TABLE public.fee_payments ADD CONSTRAINT fk_fp_financial_period 
    FOREIGN KEY (tenant_id, financial_period_id) 
    REFERENCES public.financial_periods_mapping(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;

