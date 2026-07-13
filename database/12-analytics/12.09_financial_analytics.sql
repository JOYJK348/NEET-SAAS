-- ============================================================================
-- SQL File: 12.09_financial_analytics.sql
-- Domain: Financial revenue analytics database
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Aggregates collections metrics, projections, write-offs, and refund balances.
-- 2. Scopes parameters by branch and academic years.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.financial_analytics (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    academic_year_id UUID NOT NULL,
    branch_id UUID NULL, -- Null implies default summary for tenant
    
    -- Metrics
    total_invoiced_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_received_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_outstanding_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_refunded_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_waived_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fa_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fa_academic_year FOREIGN KEY (tenant_id, academic_year_id)
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fa_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_fa_amounts CHECK (total_invoiced_amount >= 0.00 AND total_received_amount >= 0.00 AND total_outstanding_amount >= 0.00 AND total_refunded_amount >= 0.00 AND total_waived_amount >= 0.00),
    CONSTRAINT chk_fa_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fa_rebuilder ON public.financial_analytics(academic_year_id, branch_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_financial_analytics_touch_audit ON public.financial_analytics;
CREATE TRIGGER trg_biu_financial_analytics_touch_audit
    BEFORE INSERT OR UPDATE ON public.financial_analytics
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.financial_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_financial_analytics_policy ON public.financial_analytics
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_financial_analytics_policy ON public.financial_analytics
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_financial_analytics_policy ON public.financial_analytics
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_financial_analytics_policy ON public.financial_analytics
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
