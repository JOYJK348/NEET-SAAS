-- ============================================================================
-- SQL File: 10.13_fee_receipts.sql
-- Domain: Invoice and Payments Receipts Archiving (Metadata Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Rather than compiling documents live, references stored PDF objects.
-- 2. Tracks download hit counts and receipt number index formats.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_receipts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    payment_id UUID NOT NULL,
    
    -- Receipt parameters
    receipt_number VARCHAR(100) NOT NULL,
    storage_object_id VARCHAR(250) NOT NULL, -- PDF location in storage
    
    download_count INTEGER NOT NULL DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fre_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_fre_payment FOREIGN KEY (tenant_id, payment_id)
        REFERENCES public.fee_payments(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fre_number CHECK (receipt_number ~ '^[A-Z0-9/-]{5,100}$'),
    CONSTRAINT chk_fre_downloads CHECK (download_count >= 0),
    CONSTRAINT chk_fre_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate receipt numbers per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fre_tenant_number
    ON public.fee_receipts(tenant_id, receipt_number)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_fre_payment ON public.fee_receipts(payment_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_receipts DROP CONSTRAINT IF EXISTS uq_fee_receipts_tenant_id CASCADE;
ALTER TABLE public.fee_receipts ADD CONSTRAINT uq_fee_receipts_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_receipts_touch_audit ON public.fee_receipts;
CREATE TRIGGER trg_biu_fee_receipts_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_receipts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_receipts_policy ON public.fee_receipts
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_receipts_policy ON public.fee_receipts
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_receipts_policy ON public.fee_receipts
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_receipts_policy ON public.fee_receipts
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
