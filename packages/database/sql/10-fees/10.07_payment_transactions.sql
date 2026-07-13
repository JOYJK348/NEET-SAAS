-- ============================================================================
-- SQL File: 10.07_payment_transactions.sql
-- Domain: Payment Gateway API Transactions Telemetry
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures telemetry details for online transactions (Razorpay, Stripe, PhonePe).
-- 2. Stores status payloads, raw responses (JSONB), and exception failure logs.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    payment_id UUID NULL, -- Optional mapping to successful payment ledger record
    
    gateway_name VARCHAR(50) NOT NULL, -- RAZORPAY, STRIPE, CASHFREE
    gateway_transaction_id VARCHAR(250) NOT NULL,
    
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    
    -- Transaction State
    status transaction_status_enum NOT NULL DEFAULT 'PENDING',
    failure_reason TEXT NULL,
    retry_count SMALLINT NOT NULL DEFAULT 0,
    
    -- Payload dumps
    gateway_response JSONB NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pt_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_pt_payment FOREIGN KEY (tenant_id, payment_id)
        REFERENCES public.fee_payments(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_pt_amount CHECK (amount > 0.00),
    CONSTRAINT chk_pt_retries CHECK (retry_count >= 0),
    CONSTRAINT chk_pt_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate gateway references
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_pt_gateway_ref
    ON public.payment_transactions(tenant_id, gateway_name, gateway_transaction_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_pt_payment ON public.payment_transactions(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pt_status ON public.payment_transactions(status) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS uq_payment_transactions_tenant_id CASCADE;
ALTER TABLE public.payment_transactions ADD CONSTRAINT uq_payment_transactions_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_payment_transactions_touch_audit ON public.payment_transactions;
CREATE TRIGGER trg_biu_payment_transactions_touch_audit
    BEFORE INSERT OR UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_payment_transactions_policy ON public.payment_transactions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_payment_transactions_policy ON public.payment_transactions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_payment_transactions_policy ON public.payment_transactions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_payment_transactions_policy ON public.payment_transactions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
