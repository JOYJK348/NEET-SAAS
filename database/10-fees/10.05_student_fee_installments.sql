-- ============================================================================
-- SQL File: 10.05_student_fee_installments.sql
-- Domain: Student-Specific Fee Installments Ledger (Custom Override Ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures student-specific actual installment amounts and due dates.
-- 2. Materializes paid, discount, penalty, and balance quantities.
-- 3. Scopes state tracking through installment_status_enum (UNPAID, PAID, OVERDUE, WAIVED).
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_fee_installments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_assignment_id UUID NOT NULL,
    fee_installment_id UUID NULL, -- Null implies manually added ad-hoc installment
    
    installment_number SMALLINT NOT NULL DEFAULT 1,
    due_date DATE NOT NULL,
    
    -- Financial tracking metrics
    base_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    penalty_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Final target to collect
    
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Status
    status installment_status_enum NOT NULL DEFAULT 'UNPAID',
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_sfi_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_sfi_assignment FOREIGN KEY (tenant_id, student_fee_assignment_id)
        REFERENCES public.student_fee_assignments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_sfi_template FOREIGN KEY (tenant_id, fee_installment_id)
        REFERENCES public.fee_installments(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_sfi_sequence CHECK (installment_number > 0),
    CONSTRAINT chk_sfi_base CHECK (base_amount >= 0.00),
    CONSTRAINT chk_sfi_tax CHECK (tax_amount >= 0.00),
    CONSTRAINT chk_sfi_discount CHECK (discount_amount >= 0.00),
    CONSTRAINT chk_sfi_penalty CHECK (penalty_amount >= 0.00),
    CONSTRAINT chk_sfi_final CHECK (final_amount >= 0.00),
    CONSTRAINT chk_sfi_paid CHECK (paid_amount >= 0.00),
    CONSTRAINT chk_sfi_balance CHECK (balance_amount >= 0.00),
    CONSTRAINT chk_sfi_final_calc CHECK (final_amount = base_amount + tax_amount - discount_amount + penalty_amount),
    CONSTRAINT chk_sfi_balance_calc CHECK (balance_amount = final_amount - paid_amount),
    
    CONSTRAINT chk_sfi_status_sync CHECK (
        (status = 'PAID' AND balance_amount = 0.00)
        OR (status = 'PARTIALLY_PAID' AND balance_amount > 0.00 AND paid_amount > 0.00)
        OR (status = 'UNPAID' AND balance_amount = final_amount AND paid_amount = 0.00)
        OR (status = 'OVERDUE' AND balance_amount > 0.00)
        OR (status = 'WAIVED')
    ),
    
    CONSTRAINT chk_sfi_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_sfi_assignment ON public.student_fee_installments(student_fee_assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sfi_due ON public.student_fee_installments(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sfi_status ON public.student_fee_installments(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.student_fee_installments DROP CONSTRAINT IF EXISTS uq_student_fee_installments_tenant_id CASCADE;
ALTER TABLE public.student_fee_installments ADD CONSTRAINT uq_student_fee_installments_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_student_fee_installments_touch_audit ON public.student_fee_installments;
CREATE TRIGGER trg_biu_student_fee_installments_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_fee_installments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_fee_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_student_fee_installments_policy ON public.student_fee_installments
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_student_fee_installments_policy ON public.student_fee_installments
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_student_fee_installments_policy ON public.student_fee_installments
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_student_fee_installments_policy ON public.student_fee_installments
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
