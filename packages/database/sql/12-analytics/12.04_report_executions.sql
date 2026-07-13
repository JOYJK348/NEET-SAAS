-- ============================================================================
-- SQL File: 12.04_report_executions.sql
-- Domain: Report generation executions history log
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs every generation/export transaction for auditing (who, when, what format).
-- 2. Stores final storage object locations for completed reports.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.report_executions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    report_definition_id UUID NOT NULL,
    
    -- Parameters
    execution_params JSONB NULL, -- Dynamic user filters
    format_type report_format_enum NOT NULL DEFAULT 'PDF',
    
    -- Results
    storage_object_id VARCHAR(250) NULL, -- Target PDF/CSV path in storage bucket
    file_size_bytes BIGINT NULL,
    
    generated_by UUID NULL, -- References public.users.id
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
    CONSTRAINT fk_re_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_re_definition FOREIGN KEY (tenant_id, report_definition_id)
        REFERENCES public.report_definitions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_re_user FOREIGN KEY (generated_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_re_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    CONSTRAINT chk_re_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_re_definition ON public.report_executions(report_definition_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_re_user ON public.report_executions(generated_by) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_report_executions_touch_audit ON public.report_executions;
CREATE TRIGGER trg_biu_report_executions_touch_audit
    BEFORE INSERT OR UPDATE ON public.report_executions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_report_executions_policy ON public.report_executions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_report_executions_policy ON public.report_executions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_report_executions_policy ON public.report_executions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_report_executions_policy ON public.report_executions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
