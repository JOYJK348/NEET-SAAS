-- ============================================================================
-- SQL File: 10.19_fee_adjustments.sql
-- Domain: Fee Ledger Administrative Adjustments (Debit/Credit offsets)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs administrative ledger adjustments (corrections, fee increases, waivers).
-- 2. Scopes credit or debit offsets via adjustment_type_enum.
-- 3. Employs post-insert validation triggers to adjust student assignment final amounts dynamically.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_adjustments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_assignment_id UUID NOT NULL,
    
    -- Adjustment metrics
    adjustment_type adjustment_type_enum NOT NULL DEFAULT 'CREDIT',
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    reason TEXT NOT NULL,
    adjusted_by UUID NULL, -- References public.users.id
    adjusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
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
        
    -- Force tenant consistency
    CONSTRAINT fk_fa_assignment FOREIGN KEY (tenant_id, student_fee_assignment_id)
        REFERENCES public.student_fee_assignments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_fa_adjuster FOREIGN KEY (adjusted_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_fa_amount CHECK (amount > 0.00),
    CONSTRAINT chk_fa_reason CHECK (length(trim(reason)) > 0),
    CONSTRAINT chk_fa_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fa_assignment ON public.fee_adjustments(student_fee_assignment_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_adjustments DROP CONSTRAINT IF EXISTS uq_fee_adjustments_tenant_id CASCADE;
ALTER TABLE public.fee_adjustments ADD CONSTRAINT uq_fee_adjustments_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_adjustments_touch_audit ON public.fee_adjustments;
CREATE TRIGGER trg_biu_fee_adjustments_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Trigger to dynamically balance student assignments when an adjustment is registered
CREATE OR REPLACE FUNCTION public.after_fee_adjustment_applied()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_factor INT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- CREDIT deducts from student balance; DEBIT increments student balance
        v_factor := CASE WHEN NEW.adjustment_type = 'CREDIT' THEN -1 ELSE 1 END;
        
        UPDATE public.student_fee_assignments
        SET 
            adjustment_amount = adjustment_amount + (NEW.amount * v_factor),
            final_amount = final_amount + (NEW.amount * v_factor),
            version = version + 1
        WHERE id = NEW.student_fee_assignment_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_fee_adjustment_applied ON public.fee_adjustments;
CREATE TRIGGER trg_ai_fee_adjustment_applied
    AFTER INSERT ON public.fee_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION public.after_fee_adjustment_applied();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_adjustments_policy ON public.fee_adjustments
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_adjustments_policy ON public.fee_adjustments
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_adjustments_policy ON public.fee_adjustments
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_adjustments_policy ON public.fee_adjustments
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
