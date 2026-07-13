-- ============================================================================
-- SQL File: 10.12_student_fee_penalties.sql
-- Domain: Student Fee Late Penalties (Adjustment ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs penalty fee balances calculated upon late student installment completions.
-- 2. Stores late days counters, dynamic calculated amounts, and manual waiver statuses.
-- 3. Employs trigger processes to increment student installment penalty fields automatically.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_fee_penalties (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_installment_id UUID NOT NULL,
    penalty_id UUID NOT NULL,
    
    -- Penalty details
    late_days SMALLINT NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Waiver adjustments
    is_waived BOOLEAN NOT NULL DEFAULT false,
    waived_by UUID NULL, -- References public.users.id
    waived_at TIMESTAMP WITH TIME ZONE NULL,
    waive_reason TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_sfpen_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_sfpen_installment FOREIGN KEY (tenant_id, student_fee_installment_id)
        REFERENCES public.student_fee_installments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_sfpen_rule FOREIGN KEY (tenant_id, penalty_id)
        REFERENCES public.fee_penalties(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_sfpen_waiver_user FOREIGN KEY (waived_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_sfpen_days CHECK (late_days >= 0),
    CONSTRAINT chk_sfpen_amount CHECK (amount >= 0.00),
    
    CONSTRAINT chk_sfpen_waiver CHECK (
        (is_waived = false AND waived_by IS NULL AND waived_at IS NULL)
        OR (is_waived = true AND waived_by IS NOT NULL AND waived_at IS NOT NULL AND length(trim(waive_reason)) > 0)
    ),
    
    CONSTRAINT chk_sfpen_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_sfpen_installment ON public.student_fee_penalties(student_fee_installment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sfpen_rule ON public.student_fee_penalties(penalty_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.student_fee_penalties DROP CONSTRAINT IF EXISTS uq_student_fee_penalties_tenant_id CASCADE;
ALTER TABLE public.student_fee_penalties ADD CONSTRAINT uq_student_fee_penalties_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_student_fee_penalties_touch_audit ON public.student_fee_penalties;
CREATE TRIGGER trg_biu_student_fee_penalties_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_fee_penalties
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Trigger to dynamically balance student installment values upon penalty insertion or waiver updates
CREATE OR REPLACE FUNCTION public.after_student_fee_penalty_applied()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only add penalty to target installment if it is not immediately waived
        IF NEW.is_waived = false THEN
            UPDATE public.student_fee_installments
            SET 
                penalty_amount = penalty_amount + NEW.amount,
                final_amount = final_amount + NEW.amount,
                balance_amount = balance_amount + NEW.amount,
                version = version + 1
            WHERE id = NEW.student_fee_installment_id;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check if penalty has just been waived
        IF NEW.is_waived = true AND (OLD.is_waived = false) THEN
            UPDATE public.student_fee_installments
            SET 
                penalty_amount = penalty_amount - NEW.amount,
                final_amount = final_amount - NEW.amount,
                balance_amount = balance_amount - NEW.amount,
                version = version + 1
            WHERE id = NEW.student_fee_installment_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aiu_student_fee_penalty ON public.student_fee_penalties;
CREATE TRIGGER trg_aiu_student_fee_penalty
    AFTER INSERT OR UPDATE ON public.student_fee_penalties
    FOR EACH ROW
    EXECUTE FUNCTION public.after_student_fee_penalty_applied();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_fee_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_student_fee_penalties_policy ON public.student_fee_penalties
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_student_fee_penalties_policy ON public.student_fee_penalties
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_student_fee_penalties_policy ON public.student_fee_penalties
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_student_fee_penalties_policy ON public.student_fee_penalties
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
