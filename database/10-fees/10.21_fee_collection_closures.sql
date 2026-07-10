-- ============================================================================
-- SQL File: 10.21_fee_collection_closures.sql
-- Domain: Daily Cash drawer reconciliation sessions (Session Closing Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs daily cashier sessions closing amounts and physical counting checks.
-- 2. Tracks discrepancies, opening balances, and closed status parameters.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_collection_closures (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    cashier_id UUID NOT NULL, -- References public.users.id
    
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE NULL,
    
    status closure_status_enum NOT NULL DEFAULT 'OPEN',
    
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    expected_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- System expected total
    actual_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,   -- Physically counted total
    discrepancy_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    remarks TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fcc_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fcc_cashier FOREIGN KEY (cashier_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fcc_opening CHECK (opening_balance >= 0.00),
    CONSTRAINT chk_fcc_expected CHECK (expected_amount >= 0.00),
    CONSTRAINT chk_fcc_actual CHECK (actual_amount >= 0.00),
    CONSTRAINT chk_fcc_discrepancy CHECK (discrepancy_amount = expected_amount - actual_amount),
    CONSTRAINT chk_fcc_times CHECK (closed_at IS NULL OR closed_at > opened_at),
    CONSTRAINT chk_fcc_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fcc_cashier ON public.fee_collection_closures(cashier_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fcc_status ON public.fee_collection_closures(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_collection_closures DROP CONSTRAINT IF EXISTS uq_fee_collection_closures_tenant_id CASCADE;
ALTER TABLE public.fee_collection_closures ADD CONSTRAINT uq_fee_collection_closures_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_collection_closures_touch_audit ON public.fee_collection_closures;
CREATE TRIGGER trg_biu_fee_collection_closures_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_collection_closures
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_collection_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_collection_closures_policy ON public.fee_collection_closures
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_collection_closures_policy ON public.fee_collection_closures
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_collection_closures_policy ON public.fee_collection_closures
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_collection_closures_policy ON public.fee_collection_closures
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
