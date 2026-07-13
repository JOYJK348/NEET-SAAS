-- ============================================================================
-- SQL File: 10.08_payment_refunds.sql
-- Domain: Payment Refund and Reversals Ledger (Immutable Reversals)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures all refunds and billing reversal events.
-- 2. Rather than using negative rows, refund ledger maintains clean track logs.
-- 3. Employs trigger functions to update student balances post approval.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    payment_id UUID NOT NULL,
    
    -- Refund transaction details
    refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    
    status refund_status_enum NOT NULL DEFAULT 'REQUESTED',
    
    approved_by UUID NULL, -- References public.users.id
    refunded_at TIMESTAMP WITH TIME ZONE NULL,
    
    gateway_refund_id VARCHAR(250) NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pr_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_pr_payment FOREIGN KEY (tenant_id, payment_id)
        REFERENCES public.fee_payments(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_pr_approver FOREIGN KEY (approved_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_pr_amount CHECK (refund_amount > 0.00),
    CONSTRAINT chk_pr_reason CHECK (length(trim(reason)) > 0),
    CONSTRAINT chk_pr_status CHECK (
        (status = 'REQUESTED' AND approved_by IS NULL AND refunded_at IS NULL)
        OR (status IN ('APPROVED', 'PROCESSED') AND approved_by IS NOT NULL AND refunded_at IS NOT NULL)
        OR (status = 'REJECTED')
    ),
    CONSTRAINT chk_pr_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pr_payment ON public.payment_refunds(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_status ON public.payment_refunds(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.payment_refunds DROP CONSTRAINT IF EXISTS uq_payment_refunds_tenant_id CASCADE;
ALTER TABLE public.payment_refunds ADD CONSTRAINT uq_payment_refunds_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_payment_refunds_touch_audit ON public.payment_refunds;
CREATE TRIGGER trg_biu_payment_refunds_touch_audit
    BEFORE INSERT OR UPDATE ON public.payment_refunds
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Trigger to balance student installment values upon refund completion
CREATE OR REPLACE FUNCTION public.after_payment_refund_processed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_installment_id UUID;
BEGIN
    IF NEW.status = 'PROCESSED' AND (OLD.status IS DISTINCT FROM 'PROCESSED') THEN
        -- Get the installment linked to the payment
        SELECT student_fee_installment_id INTO v_installment_id
        FROM public.fee_payments
        WHERE id = NEW.payment_id;
        
        -- Restore balance amounts to the installment
        UPDATE public.student_fee_installments
        SET
            paid_amount = paid_amount - NEW.refund_amount,
            balance_amount = balance_amount + NEW.refund_amount,
            status = CASE 
                WHEN (paid_amount - NEW.refund_amount) <= 0.00 THEN 'UNPAID'::installment_status_enum
                ELSE 'PARTIALLY_PAID'::installment_status_enum
            END,
            version = version + 1
        WHERE id = v_installment_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_au_payment_refund_process ON public.payment_refunds;
CREATE TRIGGER trg_au_payment_refund_process
    AFTER UPDATE ON public.payment_refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.after_payment_refund_processed();

-- 4. Row-Level Security Configuration
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_payment_refunds_policy ON public.payment_refunds
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_payment_refunds_policy ON public.payment_refunds
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_payment_refunds_policy ON public.payment_refunds
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_payment_refunds_policy ON public.payment_refunds
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
