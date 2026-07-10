-- ============================================================================
-- SQL File: 10.22_fee_collection_centers.sql
-- Domain: Fee Collection Centers Registry (Collection site context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Registry mapping transaction target centers (campuses, bank drop points, online portals).
-- 2. Restricts parameters scoped by branch.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_collection_centers (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    branch_id UUID NULL, -- Optional mapping link to specific campus
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fccent_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fccent_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_fccent_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_fccent_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_fccent_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate center codes per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fccent_tenant_code
    ON public.fee_collection_centers(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_collection_centers DROP CONSTRAINT IF EXISTS uq_fee_collection_centers_tenant_id CASCADE;
ALTER TABLE public.fee_collection_centers ADD CONSTRAINT uq_fee_collection_centers_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_collection_centers_touch_audit ON public.fee_collection_centers;
CREATE TRIGGER trg_biu_fee_collection_centers_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_collection_centers
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_collection_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_collection_centers_policy ON public.fee_collection_centers
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_collection_centers_policy ON public.fee_collection_centers
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_collection_centers_policy ON public.fee_collection_centers
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_collection_centers_policy ON public.fee_collection_centers
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
