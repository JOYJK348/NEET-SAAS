-- ============================================================================
-- SQL File: 12.06_kpi_snapshots.sql
-- Domain: KPI Historical Time-Series snapshots (Shared platform context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs historical metrics data points over time (enables graphing trends).
-- 2. Embeds values as numeric metric attributes, mapping dimensions (course, branch).
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    kpi_definition_id UUID NOT NULL,
    
    -- Dimensions mapping context
    branch_id UUID NULL,
    course_id UUID NULL,
    
    -- Values
    metric_value DECIMAL(16,4) NOT NULL DEFAULT 0.0000,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ks_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_ks_definition FOREIGN KEY (tenant_id, kpi_definition_id)
        REFERENCES public.kpi_definitions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_ks_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_ks_course FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_ks_version CHECK (version > 0)
);

-- 2. Indexes for fast timeline graphing
CREATE INDEX IF NOT EXISTS idx_ks_grapher ON public.kpi_snapshots(kpi_definition_id, snapshot_date) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_kpi_snapshots_touch_audit ON public.kpi_snapshots;
CREATE TRIGGER trg_biu_kpi_snapshots_touch_audit
    BEFORE INSERT OR UPDATE ON public.kpi_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_kpi_snapshots_policy ON public.kpi_snapshots
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_kpi_snapshots_policy ON public.kpi_snapshots
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_kpi_snapshots_policy ON public.kpi_snapshots
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_kpi_snapshots_policy ON public.kpi_snapshots
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
