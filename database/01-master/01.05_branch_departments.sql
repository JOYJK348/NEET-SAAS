-- ============================================================================
-- SQL File: 01.05_branch_departments.sql
-- Domain: Master Core Branch Departments Mapping
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "branch_departments" functions as a bridge linking tenant-level departments to branches.
-- 2. Uses composite foreign keys (tenant_id + branch_id/department_id) with ON UPDATE CASCADE
--    to guarantee complete referential safety without orphan records.
-- 3. Configures composite tenant-scoped indexes to maximize index-only RLS query speeds.
-- 4. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.branch_departments (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    department_id UUID NOT NULL,
    
    display_order SMALLINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_bd_tenant FOREIGN KEY (tenant_id) REFERENCES public.institutes(id) ON DELETE RESTRICT,
    
    -- Composite foreign keys enforcing tenant safety
    CONSTRAINT fk_bd_branch_tenant FOREIGN KEY (tenant_id, branch_id) 
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_bd_department_tenant FOREIGN KEY (tenant_id, department_id) 
        REFERENCES public.departments(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_bd_display_order CHECK (display_order > 0),
    CONSTRAINT chk_bd_version CHECK (version > 0)
);

-- 2. Indexes for fast lookup search and UI ordering dropdowns (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_bd_tenant_id ON public.branch_departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bd_tenant_branch_active 
    ON public.branch_departments(tenant_id, branch_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bd_tenant_branch_display 
    ON public.branch_departments(tenant_id, branch_id, display_order) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bd_tenant_dept_lookup 
    ON public.branch_departments(tenant_id, department_id) 
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream staff_departments table)
ALTER TABLE public.branch_departments DROP CONSTRAINT IF EXISTS uq_branch_departments_tenant_branch_dept;
ALTER TABLE public.branch_departments ADD CONSTRAINT uq_branch_departments_tenant_branch_dept UNIQUE (tenant_id, branch_id, department_id);

-- 2.2 Partial Unique Index for Soft Deletes (prevents duplicate mappings within the branch)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_bd_branch_dept 
    ON public.branch_departments(branch_id, department_id) 
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_branch_departments_touch_audit ON public.branch_departments;
CREATE TRIGGER trg_biu_branch_departments_touch_audit
    BEFORE INSERT OR UPDATE ON public.branch_departments
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.branch_departments ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_branch_departments_select ON public.branch_departments;
CREATE POLICY policy_branch_departments_select
    ON public.branch_departments
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.branch_departments IS 'Bridge table mapping functional departments to physical branch campuses';
COMMENT ON COLUMN public.branch_departments.display_order IS 'Custom order for branch dropdown sorting';
COMMENT ON COLUMN public.branch_departments.is_active IS 'Active selection toggle inside the branch scope';
COMMENT ON COLUMN public.branch_departments.version IS 'Optimistic concurrency control version stamp';
