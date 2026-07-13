-- ============================================================================
-- SQL File: 10.06_fee_payments.sql
-- Domain: Cash/Online Transaction Payments (Collection Ledger Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs every fee payment transaction event.
-- 2. Scopes payment modes via payment_method_enum (CASH, CARD, UPI, BANK_TRANSFER, ONLINE_GATEWAY).
-- 3. Associates payments with collection centers, daily sessions cash drawer closures, and financial period mappings.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_installment_id UUID NOT NULL,
    
    -- Collection Context
    collection_center_id UUID NULL, -- Links to physical campus or online gateway site (implemented later)
    closure_id UUID NULL, -- Links to cash drawer daily reconciliation closure (implemented later)
    financial_period_id UUID NULL, -- Links to fiscal periods mapping (implemented later)
    
    -- Transaction info
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    
    reference_number VARCHAR(100) NULL, -- Bank ref number, UPI UTR, Cheque number
    received_by UUID NULL, -- References public.users.id
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
    CONSTRAINT fk_fp_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_fp_installment FOREIGN KEY (tenant_id, student_fee_installment_id)
        REFERENCES public.student_fee_installments(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fp_collector FOREIGN KEY (received_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_fp_amount CHECK (amount > 0.00),
    CONSTRAINT chk_fp_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fp_installment ON public.fee_payments(student_fee_installment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fp_date ON public.fee_payments(payment_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fp_method ON public.fee_payments(payment_method) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_payments DROP CONSTRAINT IF EXISTS uq_fee_payments_tenant_id CASCADE;
ALTER TABLE public.fee_payments ADD CONSTRAINT uq_fee_payments_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_payments_touch_audit ON public.fee_payments;
CREATE TRIGGER trg_biu_fee_payments_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Trigger to dynamically increment paid_amount and recalculate balances in student installments
CREATE OR REPLACE FUNCTION public.after_fee_payment_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.student_fee_installments
        SET 
            paid_amount = paid_amount + NEW.amount,
            balance_amount = balance_amount - NEW.amount,
            status = CASE 
                WHEN (balance_amount - NEW.amount) <= 0.00 THEN 'PAID'::installment_status_enum
                ELSE 'PARTIALLY_PAID'::installment_status_enum
            END,
            version = version + 1
        WHERE id = NEW.student_fee_installment_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_fee_payment_register ON public.fee_payments;
CREATE TRIGGER trg_ai_fee_payment_register
    AFTER INSERT ON public.fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.after_fee_payment_register();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_payments_policy ON public.fee_payments
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_payments_policy ON public.fee_payments
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_payments_policy ON public.fee_payments
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_payments_policy ON public.fee_payments
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
