-- ============================================================================
-- SQL File: 10.20_payment_allocations.sql
-- Domain: Payment Component Allocation Ledger (Audit trails)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps individual payments split across multiple fee structure items or installments.
-- 2. Maintains clean double-entry tracks preserving financial histories.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    payment_id UUID NOT NULL,
    student_fee_installment_id UUID NOT NULL,
    fee_structure_item_id UUID NULL, -- Optional mapping if allocated to specific items (books, tuition)
    
    amount DECIMAL(12,2) NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pa_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_pa_payment FOREIGN KEY (tenant_id, payment_id)
        REFERENCES public.fee_payments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_pa_installment FOREIGN KEY (tenant_id, student_fee_installment_id)
        REFERENCES public.student_fee_installments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_pa_item FOREIGN KEY (tenant_id, fee_structure_item_id)
        REFERENCES public.fee_structure_items(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_pa_amount CHECK (amount > 0.00),
    CONSTRAINT chk_pa_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pa_payment ON public.payment_allocations(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pa_installment ON public.payment_allocations(student_fee_installment_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_payment_allocations_touch_audit ON public.payment_allocations;
CREATE TRIGGER trg_biu_payment_allocations_touch_audit
    BEFORE INSERT OR UPDATE ON public.payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_payment_allocations_policy ON public.payment_allocations
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_payment_allocations_policy ON public.payment_allocations
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_payment_allocations_policy ON public.payment_allocations
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_payment_allocations_policy ON public.payment_allocations
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
