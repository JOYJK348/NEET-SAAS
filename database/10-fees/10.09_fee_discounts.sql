-- ============================================================================
-- SQL File: 10.09_fee_discounts.sql
-- Domain: Fee Discounts Template Configuration (Pricing Master Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps template discount configurations (Sibling Discount, NEET Score Merit).
-- 2. Scopes maximum caps and percentage vs flat calculation options.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_discounts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Discount parameters
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    discount_percentage DECIMAL(5,2) NULL, -- Percentage mapping (0.01 to 100.00)
    discount_amount DECIMAL(12,2) NULL, -- Flat discount mapping
    
    max_discount_limit DECIMAL(12,2) NULL, -- Caps percentage limits
    
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fd_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_fd_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_fd_value CHECK (
        (discount_percentage IS NOT NULL AND discount_amount IS NULL AND discount_percentage BETWEEN 0.01 AND 100.00)
        OR (discount_amount IS NOT NULL AND discount_percentage IS NULL AND discount_amount > 0.00)
    ),
    CONSTRAINT chk_fd_max CHECK (max_discount_limit IS NULL OR max_discount_limit >= 0.00),
    CONSTRAINT chk_fd_dates CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT chk_fd_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fd_tenant_code
    ON public.fee_discounts(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_discounts DROP CONSTRAINT IF EXISTS uq_fee_discounts_tenant_id CASCADE;
ALTER TABLE public.fee_discounts ADD CONSTRAINT uq_fee_discounts_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_discounts_touch_audit ON public.fee_discounts;
CREATE TRIGGER trg_biu_fee_discounts_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_discounts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_discounts_policy ON public.fee_discounts
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_discounts_policy ON public.fee_discounts
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_discounts_policy ON public.fee_discounts
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_discounts_policy ON public.fee_discounts
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
