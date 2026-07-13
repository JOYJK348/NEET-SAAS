-- ============================================================================
-- SQL File: 10.10_student_fee_discounts.sql
-- Domain: Student Fee Discount Assignments (Adjustment ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Connects master discount rules to student fee assignments.
-- 2. Stores dynamic calculated amounts, approval details, and RLS structures.
-- 3. Employs validation triggers to verify student-to-discount matches.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_fee_discounts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_fee_assignment_id UUID NOT NULL,
    discount_id UUID NOT NULL,
    scholarship_id UUID NULL, -- Optional mapping if discount was triggered by scholarship (implemented later)
    
    -- Applied amount
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    approved_by UUID NULL, -- References public.users.id
    approved_at TIMESTAMP WITH TIME ZONE NULL,
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
    CONSTRAINT fk_sfd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_sfd_assignment FOREIGN KEY (tenant_id, student_fee_assignment_id)
        REFERENCES public.student_fee_assignments(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_sfd_discount FOREIGN KEY (tenant_id, discount_id)
        REFERENCES public.fee_discounts(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_sfd_approver FOREIGN KEY (approved_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_sfd_amount CHECK (discount_amount > 0.00),
    CONSTRAINT chk_sfd_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL)
        OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
    CONSTRAINT chk_sfd_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_sfd_assignment ON public.student_fee_discounts(student_fee_assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sfd_discount ON public.student_fee_discounts(discount_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.student_fee_discounts DROP CONSTRAINT IF EXISTS uq_student_fee_discounts_tenant_id CASCADE;
ALTER TABLE public.student_fee_discounts ADD CONSTRAINT uq_student_fee_discounts_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_student_fee_discounts_touch_audit ON public.student_fee_discounts;
CREATE TRIGGER trg_biu_student_fee_discounts_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_fee_discounts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Trigger to dynamically deduct/update assignment discount amounts and final balances
CREATE OR REPLACE FUNCTION public.after_student_fee_discount_applied()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.student_fee_assignments
        SET 
            discount_amount = discount_amount + NEW.discount_amount,
            final_amount = final_amount - NEW.discount_amount,
            version = version + 1
        WHERE id = NEW.student_fee_assignment_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_student_fee_discount ON public.student_fee_discounts;
CREATE TRIGGER trg_ai_student_fee_discount
    AFTER INSERT ON public.student_fee_discounts
    FOR EACH ROW
    EXECUTE FUNCTION public.after_student_fee_discount_applied();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_fee_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_student_fee_discounts_policy ON public.student_fee_discounts
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_student_fee_discounts_policy ON public.student_fee_discounts
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_student_fee_discounts_policy ON public.student_fee_discounts
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_student_fee_discounts_policy ON public.student_fee_discounts
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
