-- ============================================================================
-- SQL File: 10.16_payment_reconciliation.sql
-- Domain: Payment Reconciliation Ledger (Double-Entry Checking)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Compares bank statement records with internal payments database mappings.
-- 2. Tracks discrepancies, ledger exceptions, and matching timestamps.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.payment_reconciliation (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    payment_id UUID NULL, -- Links to validated payment ledger record
    transaction_id UUID NULL, -- Links to gateway transaction telemetry
    
    reconciled_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status reconciliation_status_enum NOT NULL DEFAULT 'UNMATCHED',
    
    -- Telemetry mapping details
    bank_statement_ref VARCHAR(150) NULL,
    expected_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) NOT NULL,
    discrepancy_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    reconciled_by UUID NULL, -- References public.users.id
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
    CONSTRAINT fk_pre_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_pre_payment FOREIGN KEY (tenant_id, payment_id)
        REFERENCES public.fee_payments(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_pre_transaction FOREIGN KEY (tenant_id, transaction_id)
        REFERENCES public.payment_transactions(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_pre_reconciler FOREIGN KEY (reconciled_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_pre_expected CHECK (expected_amount >= 0.00),
    CONSTRAINT chk_pre_actual CHECK (actual_amount >= 0.00),
    CONSTRAINT chk_pre_discrepancy CHECK (discrepancy_amount = expected_amount - actual_amount),
    CONSTRAINT chk_pre_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pre_payment ON public.payment_reconciliation(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pre_status ON public.payment_reconciliation(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.payment_reconciliation DROP CONSTRAINT IF EXISTS uq_payment_reconciliation_tenant_id CASCADE;
ALTER TABLE public.payment_reconciliation ADD CONSTRAINT uq_payment_reconciliation_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_payment_reconciliation_touch_audit ON public.payment_reconciliation;
CREATE TRIGGER trg_biu_payment_reconciliation_touch_audit
    BEFORE INSERT OR UPDATE ON public.payment_reconciliation
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.payment_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_payment_reconciliation_policy ON public.payment_reconciliation
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_payment_reconciliation_policy ON public.payment_reconciliation
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_payment_reconciliation_policy ON public.payment_reconciliation
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_payment_reconciliation_policy ON public.payment_reconciliation
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
