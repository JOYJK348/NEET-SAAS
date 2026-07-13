-- ============================================================================
-- SQL File: 10.14_scholarships.sql
-- Domain: Scholarships Catalog configurations (Academic Merit Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Structures merit or scholarship templates mappings.
-- 2. Restricts maximum limit boundaries and percentage/flat amount offsets.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.scholarships (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Scholarship parameters
    name VARCHAR(150) NOT NULL,
    criteria TEXT NOT NULL,
    
    scholarship_percentage DECIMAL(5,2) NULL,
    scholarship_amount DECIMAL(12,2) NULL,
    max_amount_limit DECIMAL(12,2) NULL,
    
    valid_from DATE NOT NULL,
    valid_to DATE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_scho_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_scho_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_scho_criteria CHECK (length(trim(criteria)) > 0),
    CONSTRAINT chk_scho_value CHECK (
        (scholarship_percentage IS NOT NULL AND scholarship_amount IS NULL AND scholarship_percentage BETWEEN 0.01 AND 100.00)
        OR (scholarship_amount IS NOT NULL AND scholarship_percentage IS NULL AND scholarship_amount > 0.00)
    ),
    CONSTRAINT chk_scho_max CHECK (max_amount_limit IS NULL OR max_amount_limit >= 0.00),
    CONSTRAINT chk_scho_dates CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT chk_scho_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_scho_dates ON public.scholarships(valid_from, valid_to) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.scholarships DROP CONSTRAINT IF EXISTS uq_scholarships_tenant_id CASCADE;
ALTER TABLE public.scholarships ADD CONSTRAINT uq_scholarships_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_scholarships_touch_audit ON public.scholarships;
CREATE TRIGGER trg_biu_scholarships_touch_audit
    BEFORE INSERT OR UPDATE ON public.scholarships
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_scholarships_policy ON public.scholarships
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_scholarships_policy ON public.scholarships
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_scholarships_policy ON public.scholarships
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_scholarships_policy ON public.scholarships
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Backward foreign key linking to resolve circular load-order dependencies
ALTER TABLE public.student_fee_discounts DROP CONSTRAINT IF EXISTS fk_sfd_scholarship;
ALTER TABLE public.student_fee_discounts ADD CONSTRAINT fk_sfd_scholarship 
    FOREIGN KEY (tenant_id, scholarship_id) 
    REFERENCES public.scholarships(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;

