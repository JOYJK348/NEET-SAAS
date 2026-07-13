-- ============================================================================
-- SQL File: 12.01_dashboard_definitions.sql
-- Domain: Dashboard Layout definitions (Aggregate Root)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Structures visual dashboard canvases configured per tenant.
-- 2. Scopes access mapping directly to dashboard_viewer_role_enum.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.dashboard_definitions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. STUDENT_DEFAULT, PRINCIPAL_MONITOR
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    target_role dashboard_viewer_role_enum NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Layout properties mapping
    grid_layout JSONB NULL, -- Grid dimensions or layout tags
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_dd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_dd_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_dd_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_dd_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate dashboard templates per target role per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_dd_tenant_role
    ON public.dashboard_definitions(tenant_id, target_role)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.dashboard_definitions DROP CONSTRAINT IF EXISTS uq_dashboard_definitions_tenant_id CASCADE;
ALTER TABLE public.dashboard_definitions ADD CONSTRAINT uq_dashboard_definitions_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_dashboard_definitions_touch_audit ON public.dashboard_definitions;
CREATE TRIGGER trg_biu_dashboard_definitions_touch_audit
    BEFORE INSERT OR UPDATE ON public.dashboard_definitions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.dashboard_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_dashboard_definitions_policy ON public.dashboard_definitions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_dashboard_definitions_policy ON public.dashboard_definitions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_dashboard_definitions_policy ON public.dashboard_definitions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_dashboard_definitions_policy ON public.dashboard_definitions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
