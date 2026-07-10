-- ============================================================================
-- SQL File: 12.02_dashboard_widgets.sql
-- Domain: Dashboard visual widget configurations
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Sets size, positioning, query hooks for specific charts or KPI metrics.
-- 2. Scopes formatting variables inside JSONB configurations fields.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    dashboard_definition_id UUID NOT NULL,
    
    -- Widget characteristics
    name VARCHAR(100) NOT NULL,
    widget_type widget_type_enum NOT NULL DEFAULT 'KPI_CARD',
    
    -- Positioning coordinates
    row_index SMALLINT NOT NULL DEFAULT 0,
    col_index SMALLINT NOT NULL DEFAULT 0,
    size_width SMALLINT NOT NULL DEFAULT 4, -- Grid width span
    size_height SMALLINT NOT NULL DEFAULT 2, -- Grid height span
    
    -- Query reference logic details
    data_source_query TEXT NOT NULL, -- SQL block or function hook name
    display_config JSONB NULL, -- color schemas, labels overrides
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_dw_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_dw_dashboard FOREIGN KEY (tenant_id, dashboard_definition_id)
        REFERENCES public.dashboard_definitions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_dw_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_dw_pos CHECK (row_index >= 0 AND col_index >= 0),
    CONSTRAINT chk_dw_size CHECK (size_width > 0 AND size_height > 0),
    CONSTRAINT chk_dw_query CHECK (length(trim(data_source_query)) > 0),
    CONSTRAINT chk_dw_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_dw_dashboard ON public.dashboard_widgets(dashboard_definition_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.dashboard_widgets DROP CONSTRAINT IF EXISTS uq_dashboard_widgets_tenant_id CASCADE;
ALTER TABLE public.dashboard_widgets ADD CONSTRAINT uq_dashboard_widgets_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_dashboard_widgets_touch_audit ON public.dashboard_widgets;
CREATE TRIGGER trg_biu_dashboard_widgets_touch_audit
    BEFORE INSERT OR UPDATE ON public.dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_dashboard_widgets_policy ON public.dashboard_widgets
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_dashboard_widgets_policy ON public.dashboard_widgets
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_dashboard_widgets_policy ON public.dashboard_widgets
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_dashboard_widgets_policy ON public.dashboard_widgets
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
