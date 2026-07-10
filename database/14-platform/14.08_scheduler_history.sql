-- ============================================================================
-- SQL File: 14.08_scheduler_history.sql
-- Domain: Cron task scheduler execution history logs
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs every trigger execution event of cron scheduled jobs.
-- 2. Scopes parameters tracking performance logs and exit status tags.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.scheduler_history (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    scheduler_job_id UUID NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED, SKIPPED
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    execution_duration_ms INTEGER NULL,
    
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
    CONSTRAINT fk_sh_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_sh_job FOREIGN KEY (tenant_id, scheduler_job_id)
        REFERENCES public.scheduler_jobs(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_sh_times CHECK (completed_at IS NULL OR completed_at >= started_at),
    CONSTRAINT chk_sh_duration CHECK (execution_duration_ms IS NULL OR execution_duration_ms >= 0),
    CONSTRAINT chk_sh_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_sh_job ON public.scheduler_history(scheduler_job_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_scheduler_history_touch_audit ON public.scheduler_history;
CREATE TRIGGER trg_biu_scheduler_history_touch_audit
    BEFORE INSERT OR UPDATE ON public.scheduler_history
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.scheduler_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_scheduler_history_policy ON public.scheduler_history
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_scheduler_history_policy ON public.scheduler_history
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_scheduler_history_policy ON public.scheduler_history
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_scheduler_history_policy ON public.scheduler_history
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
