-- ============================================================================
-- SQL File: 14.06_job_executions.sql
-- Domain: Background Job Execution Trace (Jobs Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs every attempt/run of a background job.
-- 2. Scopes timing metrics, memory footprints, and retry numbers.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.job_executions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    background_job_id UUID NOT NULL,
    
    attempt_number SMALLINT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    execution_duration_ms INTEGER NULL,
    
    memory_peak_bytes BIGINT NULL,
    error_message TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_jex_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_jex_job FOREIGN KEY (tenant_id, background_job_id)
        REFERENCES public.background_jobs(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_jex_attempts CHECK (attempt_number > 0),
    CONSTRAINT chk_jex_times CHECK (completed_at IS NULL OR completed_at >= started_at),
    CONSTRAINT chk_jex_duration CHECK (execution_duration_ms IS NULL OR execution_duration_ms >= 0),
    CONSTRAINT chk_jex_memory CHECK (memory_peak_bytes IS NULL OR memory_peak_bytes >= 0),
    CONSTRAINT chk_jex_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_jex_job ON public.job_executions(background_job_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_job_executions_touch_audit ON public.job_executions;
CREATE TRIGGER trg_biu_job_executions_touch_audit
    BEFORE INSERT OR UPDATE ON public.job_executions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.job_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_job_executions_policy ON public.job_executions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_job_executions_policy ON public.job_executions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_job_executions_policy ON public.job_executions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_job_executions_policy ON public.job_executions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
