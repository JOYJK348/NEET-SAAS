-- ============================================================================
-- SQL File: 10.04_fee_installments.sql
-- Domain: Fee Installment Plans Template Configurations
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Defines template installment models mapping due date ratios (due_days / offset_days).
-- 2. Embeds sequence numbering rules and penalty config rule tags.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_installments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    fee_structure_id UUID NOT NULL,
    
    -- Installment parameters
    installment_number SMALLINT NOT NULL DEFAULT 1,
    offset_days SMALLINT NOT NULL DEFAULT 0, -- Days from assignment date when this is due
    amount_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00, -- percentage of overall structure cost
    
    grace_days SMALLINT NOT NULL DEFAULT 0,
    late_fee_rule_id UUID NULL, -- Links to late fee rules penalty configuration (implemented later)
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fi_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency between structure catalog and installment templates
    CONSTRAINT fk_fi_structure FOREIGN KEY (tenant_id, fee_structure_id)
        REFERENCES public.fee_structures(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_fi_sequence CHECK (installment_number > 0),
    CONSTRAINT chk_fi_offset CHECK (offset_days >= 0),
    CONSTRAINT chk_fi_percentage CHECK (amount_percentage BETWEEN 0.01 AND 100.00),
    CONSTRAINT chk_fi_grace CHECK (grace_days >= 0),
    CONSTRAINT chk_fi_version CHECK (version > 0)
);

-- 2. Unique: only one installment index mapping per structure plan
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fi_structure_sequence
    ON public.fee_installments(tenant_id, fee_structure_id, installment_number)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_fi_structure ON public.fee_installments(fee_structure_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_installments DROP CONSTRAINT IF EXISTS uq_fee_installments_tenant_id CASCADE;
ALTER TABLE public.fee_installments ADD CONSTRAINT uq_fee_installments_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_installments_touch_audit ON public.fee_installments;
CREATE TRIGGER trg_biu_fee_installments_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_installments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_installments_policy ON public.fee_installments
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_installments_policy ON public.fee_installments
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_installments_policy ON public.fee_installments
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_installments_policy ON public.fee_installments
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
