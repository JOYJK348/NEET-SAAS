-- ============================================================================
-- SQL File: 10.15_fee_waivers.sql
-- Domain: Student Fee Waivers Registry (Adjustment ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures manual fee waiver allocations (separate from structured discounts).
-- 2. Embeds approval references and automatic post-insert update triggers.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_waivers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_installment_id UUID NOT NULL,
    
    -- Waiver details
    waiver_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    
    approved_by UUID NULL, -- References public.users.id
    approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fw_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_fw_installment FOREIGN KEY (tenant_id, student_fee_installment_id)
        REFERENCES public.student_fee_installments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_fw_approver FOREIGN KEY (approved_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_fw_amount CHECK (waiver_amount > 0.00),
    CONSTRAINT chk_fw_reason CHECK (length(trim(reason)) > 0),
    CONSTRAINT chk_fw_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fw_installment ON public.fee_waivers(student_fee_installment_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_waivers DROP CONSTRAINT IF EXISTS uq_fee_waivers_tenant_id CASCADE;
ALTER TABLE public.fee_waivers ADD CONSTRAINT uq_fee_waivers_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_waivers_touch_audit ON public.fee_waivers;
CREATE TRIGGER trg_biu_fee_waivers_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_waivers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Trigger to dynamically balance student installments when a waiver is applied
CREATE OR REPLACE FUNCTION public.after_fee_waiver_applied()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.student_fee_installments
        SET 
            discount_amount = discount_amount + NEW.waiver_amount,
            final_amount = final_amount - NEW.waiver_amount,
            balance_amount = balance_amount - NEW.waiver_amount,
            status = CASE 
                WHEN (balance_amount - NEW.waiver_amount) <= 0.00 THEN 'WAIVED'::installment_status_enum
                ELSE status
            END,
            version = version + 1
        WHERE id = NEW.student_fee_installment_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_fee_waiver_applied ON public.fee_waivers;
CREATE TRIGGER trg_ai_fee_waiver_applied
    AFTER INSERT ON public.fee_waivers
    FOR EACH ROW
    EXECUTE FUNCTION public.after_fee_waiver_applied();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_waivers_policy ON public.fee_waivers
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_waivers_policy ON public.fee_waivers
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_waivers_policy ON public.fee_waivers
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_waivers_policy ON public.fee_waivers
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
