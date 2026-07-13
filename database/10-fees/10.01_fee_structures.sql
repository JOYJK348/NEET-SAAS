-- ============================================================================
-- SQL File: 10.01_fee_structures.sql
-- Domain: Fee Structures Catalog configurations (Aggregate Root)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Structures pricing catalog mappings per tenant.
-- 2. Scopes parameters to course, academic years, branches, or department lines.
-- 3. Enables future planning using effective dates validation check constraints.
-- 4. Uses touch_audit_columns trigger to automate record version updates.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Academic Context
    course_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    branch_id UUID NULL, -- Null implies default structure for all branch campuses
    department_id UUID NULL, -- Optional mapping for specific departments
    
    -- Configuration Metadata
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    -- Validity Range
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE NULL,
    
    -- Status
    status fee_structure_status_enum NOT NULL DEFAULT 'ACTIVE',
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_fs_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fs_course_tenant FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fs_academic_year_tenant FOREIGN KEY (tenant_id, academic_year_id)
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fs_branch_tenant FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_fs_dept_tenant FOREIGN KEY (tenant_id, department_id)
        REFERENCES public.departments(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_fs_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_fs_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_fs_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT chk_fs_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within the same tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_fs_tenant_code
    ON public.fee_structures(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_fs_tenant_course ON public.fee_structures(tenant_id, course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fs_tenant_ay ON public.fee_structures(tenant_id, academic_year_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS uq_fee_structures_tenant_id CASCADE;
ALTER TABLE public.fee_structures ADD CONSTRAINT uq_fee_structures_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_fee_structures_touch_audit ON public.fee_structures;
CREATE TRIGGER trg_biu_fee_structures_touch_audit
    BEFORE INSERT OR UPDATE ON public.fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks
CREATE OR REPLACE FUNCTION public.validate_fee_structure_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_course_tenant UUID;
    v_ay_tenant UUID;
BEGIN
    SELECT tenant_id INTO v_course_tenant FROM public.courses WHERE id = NEW.course_id;
    IF v_course_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: course tenant does not match fee structure tenant';
    END IF;
    
    SELECT tenant_id INTO v_ay_tenant FROM public.academic_years WHERE id = NEW.academic_year_id;
    IF v_ay_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: academic year tenant does not match fee structure tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_fee_structure_tenant_validate ON public.fee_structures;
CREATE TRIGGER trg_biu_fee_structure_tenant_validate
    BEFORE INSERT OR UPDATE ON public.fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION validate_fee_structure_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_fee_structures_policy ON public.fee_structures
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_fee_structures_policy ON public.fee_structures
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_fee_structures_policy ON public.fee_structures
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_fee_structures_policy ON public.fee_structures
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
