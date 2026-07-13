-- ============================================================================
-- SQL File: 14.05_background_jobs.sql
-- Domain: Decoupled Background Task queues (Jobs Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Segregates long-running tasks execution (SMS, AI, Excel exports) from HTTP loops.
-- 2. Scopes parameters using background_job_status_enum.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    job_type VARCHAR(100) NOT NULL, -- e.g. EXPORT_EXCEL, GENERATE_REPORT, SEND_BULK_EMAIL
    status background_job_status_enum NOT NULL DEFAULT 'PENDING',
    
    payload JSONB NULL, -- Parameters input details
    priority SMALLINT NOT NULL DEFAULT 3, -- 1 = High, 5 = Low
    
    scheduled_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_bj_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_bj_type CHECK (length(trim(job_type)) > 0),
    CONSTRAINT chk_bj_priority CHECK (priority > 0),
    CONSTRAINT chk_bj_version CHECK (version > 0)
);

-- 2. Indexes for fast worker polling
CREATE INDEX IF NOT EXISTS idx_bj_poller 
    ON public.background_jobs(tenant_id, status, priority, scheduled_run_at) 
    WHERE deleted_at IS NULL AND status IN ('PENDING');

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.background_jobs DROP CONSTRAINT IF EXISTS uq_background_jobs_tenant_id CASCADE;
ALTER TABLE public.background_jobs ADD CONSTRAINT uq_background_jobs_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_background_jobs_touch_audit ON public.background_jobs;
CREATE TRIGGER trg_biu_background_jobs_touch_audit
    BEFORE INSERT OR UPDATE ON public.background_jobs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_background_jobs_policy ON public.background_jobs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_background_jobs_policy ON public.background_jobs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_background_jobs_policy ON public.background_jobs
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_background_jobs_policy ON public.background_jobs
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
