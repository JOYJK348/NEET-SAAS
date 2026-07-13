-- ============================================================================
-- SQL File: 14.12_error_logs.sql
-- Domain: System Application Error Tracing (Monitoring context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Central repository logging uncaught backend runtime errors and exception stacks.
-- 2. Includes correlation IDs to allow trace tracking across modules.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    correlation_id UUID NOT NULL, -- Correlation ID to link request trace
    
    module_name VARCHAR(100) NOT NULL, -- e.g. FEES, AUTH, AI
    error_severity VARCHAR(20) NOT NULL DEFAULT 'ERROR', -- WARNING, ERROR, CRITICAL
    
    error_message TEXT NOT NULL,
    stack_trace TEXT NULL,
    
    resolved_status BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    resolved_by_user UUID NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_el_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_el_resolver FOREIGN KEY (resolved_by_user)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_el_module CHECK (length(trim(module_name)) > 0),
    CONSTRAINT chk_el_msg CHECK (length(trim(error_message)) > 0),
    CONSTRAINT chk_el_severity CHECK (error_severity IN ('WARNING', 'ERROR', 'CRITICAL')),
    CONSTRAINT chk_el_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_el_correlation ON public.error_logs(correlation_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_el_resolved ON public.error_logs(tenant_id, resolved_status) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_error_logs_touch_audit ON public.error_logs;
CREATE TRIGGER trg_biu_error_logs_touch_audit
    BEFORE INSERT OR UPDATE ON public.error_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_error_logs_policy ON public.error_logs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_error_logs_policy ON public.error_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_error_logs_policy ON public.error_logs
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_error_logs_policy ON public.error_logs
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
