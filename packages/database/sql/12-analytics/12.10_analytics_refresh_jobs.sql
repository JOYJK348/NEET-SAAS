-- ============================================================================
-- SQL File: 12.10_analytics_refresh_jobs.sql
-- Domain: Materialized aggregates rebuild logs (Refresh jobs context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs refresh pipeline executions (who triggered, execution duration, and errors).
-- 2. Scopes parameters using refresh_job_status_enum.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.analytics_refresh_jobs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    target_metric VARCHAR(100) NOT NULL, -- e.g. STUDENT_ANALYTICS, FINANCIALS
    
    status refresh_job_status_enum NOT NULL DEFAULT 'PENDING',
    
    started_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    
    execution_duration_ms INTEGER NULL,
    error_log TEXT NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_arj_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_arj_metric CHECK (length(trim(target_metric)) > 0),
    CONSTRAINT chk_arj_times CHECK (completed_at IS NULL OR completed_at > started_at),
    CONSTRAINT chk_arj_duration CHECK (execution_duration_ms IS NULL OR execution_duration_ms >= 0),
    CONSTRAINT chk_arj_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_arj_status ON public.analytics_refresh_jobs(tenant_id, status) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_analytics_refresh_jobs_touch_audit ON public.analytics_refresh_jobs;
CREATE TRIGGER trg_biu_analytics_refresh_jobs_touch_audit
    BEFORE INSERT OR UPDATE ON public.analytics_refresh_jobs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.analytics_refresh_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_analytics_refresh_jobs_policy ON public.analytics_refresh_jobs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_analytics_refresh_jobs_policy ON public.analytics_refresh_jobs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_analytics_refresh_jobs_policy ON public.analytics_refresh_jobs
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_analytics_refresh_jobs_policy ON public.analytics_refresh_jobs
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
