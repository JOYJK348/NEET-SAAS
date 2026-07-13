-- ============================================================================
-- SQL File: 12.05_kpi_definitions.sql
-- Domain: KPI Metrics configurations (Shared platform context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Metric calculation templates catalog (e.g. Revenue collect %, Attendance %).
-- 2. Embeds refresh frequency configurations, formula calculation details.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.kpi_definitions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. REV_COLLECT_PCT, ATTENDANCE_AVG_PCT
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    formula_expression TEXT NOT NULL, -- Logical expression detail description
    refresh_frequency VARCHAR(50) NOT NULL DEFAULT 'DAILY', -- DAILY, WEEKLY, REALTIME
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_kd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_kd_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_kd_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_kd_formula CHECK (length(trim(formula_expression)) > 0),
    CONSTRAINT chk_kd_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate KPI codes per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_kd_tenant_code
    ON public.kpi_definitions(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.kpi_definitions DROP CONSTRAINT IF EXISTS uq_kpi_definitions_tenant_id CASCADE;
ALTER TABLE public.kpi_definitions ADD CONSTRAINT uq_kpi_definitions_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_kpi_definitions_touch_audit ON public.kpi_definitions;
CREATE TRIGGER trg_biu_kpi_definitions_touch_audit
    BEFORE INSERT OR UPDATE ON public.kpi_definitions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_kpi_definitions_policy ON public.kpi_definitions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_kpi_definitions_policy ON public.kpi_definitions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_kpi_definitions_policy ON public.kpi_definitions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_kpi_definitions_policy ON public.kpi_definitions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
