-- ============================================================================
-- SQL File: 10.02_fee_structure_items.sql
-- Domain: Fee Structure Items Component Breakdown
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Breaks down overall package total costs into itemized components (Admission, Books, Tuition).
-- 2. Stores tax rates, refundable status, and priority display order mapping configurations.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_structure_items (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    fee_structure_id UUID NOT NULL,
    
    -- Component Metadata
    item_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- e.g. 18.00% GST
    
    -- Sorting & Rules
    display_order SMALLINT NOT NULL DEFAULT 1,
    mandatory BOOLEAN NOT NULL DEFAULT true,
    refundable BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fsi_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency between structure catalog and components
    CONSTRAINT fk_fsi_structure FOREIGN KEY (tenant_id, fee_structure_id)
        REFERENCES public.fee_structures(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_fsi_name CHECK (length(trim(item_name)) > 0),
    CONSTRAINT chk_fsi_amount CHECK (amount >= 0.00),
    CONSTRAINT chk_fsi_tax CHECK (tax_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_fsi_order CHECK (display_order > 0),
    CONSTRAINT chk_fsi_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate component item names within the same package
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fsi_structure_item_name
    ON public.fee_structure_items(tenant_id, fee_structure_id, lower(trim(item_name)))
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_fsi_structure ON public.fee_structure_items(fee_structure_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_structure_items DROP CONSTRAINT IF EXISTS uq_fee_structure_items_tenant_id CASCADE;
ALTER TABLE public.fee_structure_items ADD CONSTRAINT uq_fee_structure_items_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_structure_items_touch_audit ON public.fee_structure_items;
CREATE TRIGGER trg_biu_fee_structure_items_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_structure_items
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_structure_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_structure_items_policy ON public.fee_structure_items
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_structure_items_policy ON public.fee_structure_items
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_structure_items_policy ON public.fee_structure_items
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_structure_items_policy ON public.fee_structure_items
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
