-- ============================================================================
-- SQL File: 10.03_student_fee_assignments.sql
-- Domain: Student Fee Structure Assignment Ledger (Student Ledger Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Links a specific fee structure package to a student's active admission context.
-- 2. Materializes final net amounts factoring in discounts, waivers, and adjustments.
-- 3. Utilizes composite keys to ensure strict tenant validation safety.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_admission_id UUID NOT NULL,
    fee_structure_id UUID NOT NULL,
    
    -- Financial ledger materialization
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    base_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    adjustment_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Offset adjustments (+/-)
    final_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Final net collection target
    
    assigned_by UUID NULL, -- References public.users.id
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
    CONSTRAINT fk_sfa_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_sfa_structure FOREIGN KEY (tenant_id, fee_structure_id)
        REFERENCES public.fee_structures(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_sfa_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_sfa_assigner FOREIGN KEY (assigned_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_sfa_base CHECK (base_amount >= 0.00),
    CONSTRAINT chk_sfa_tax CHECK (tax_amount >= 0.00),
    CONSTRAINT chk_sfa_discount CHECK (discount_amount >= 0.00),
    CONSTRAINT chk_sfa_final CHECK (final_amount >= 0.00),
    CONSTRAINT chk_sfa_net_balance CHECK (final_amount = base_amount + tax_amount - discount_amount + adjustment_amount),
    CONSTRAINT chk_sfa_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_sfa_student ON public.student_fee_assignments(student_admission_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sfa_structure ON public.student_fee_assignments(fee_structure_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.student_fee_assignments DROP CONSTRAINT IF EXISTS uq_student_fee_assignments_tenant_id CASCADE;
ALTER TABLE public.student_fee_assignments ADD CONSTRAINT uq_student_fee_assignments_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_student_fee_assignments_touch_audit ON public.student_fee_assignments;
CREATE TRIGGER trg_biu_student_fee_assignments_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_fee_assignments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks for student admission mapping
CREATE OR REPLACE FUNCTION public.validate_student_fee_assignment_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_tenant UUID;
BEGIN
    SELECT tenant_id INTO v_student_tenant 
    FROM public.student_admissions 
    WHERE id = NEW.student_admission_id;
    
    IF v_student_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: student admission tenant does not match fee assignment tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_student_fee_assignment_tenant_validate ON public.student_fee_assignments;
CREATE TRIGGER trg_biu_student_fee_assignment_tenant_validate
    BEFORE INSERT OR UPDATE ON public.student_fee_assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_student_fee_assignment_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_fee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_student_fee_assignments_policy ON public.student_fee_assignments
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_student_fee_assignments_policy ON public.student_fee_assignments
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_student_fee_assignments_policy ON public.student_fee_assignments
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_student_fee_assignments_policy ON public.student_fee_assignments
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
