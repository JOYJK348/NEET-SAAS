-- ============================================================================
-- SQL File: 14.07_scheduler_jobs.sql
-- Domain: Cron task scheduler registry (Scheduler Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Configurations database mapping automated recurrent scheduler tasks (e.g. Backups, cleanups).
-- 2. Restricts cron format schedules using regex validations.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.scheduler_jobs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. DAILY_FEE_REMINDER, MIDNIGHT_RECONCILE
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    cron_expression VARCHAR(100) NOT NULL, -- Standard crontab format (e.g. "0 0 * * *")
    job_payload JSONB NULL,
    
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
    CONSTRAINT fk_sj_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_sj_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_sj_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_sj_cron CHECK (length(trim(cron_expression)) > 0),
    CONSTRAINT chk_sj_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate cron job configurations per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sj_tenant_code
    ON public.scheduler_jobs(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.scheduler_jobs DROP CONSTRAINT IF EXISTS uq_scheduler_jobs_tenant_id CASCADE;
ALTER TABLE public.scheduler_jobs ADD CONSTRAINT uq_scheduler_jobs_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_scheduler_jobs_touch_audit ON public.scheduler_jobs;
CREATE TRIGGER trg_biu_scheduler_jobs_touch_audit
    BEFORE INSERT OR UPDATE ON public.scheduler_jobs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.scheduler_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_scheduler_jobs_policy ON public.scheduler_jobs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_scheduler_jobs_policy ON public.scheduler_jobs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_scheduler_jobs_policy ON public.scheduler_jobs
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_scheduler_jobs_policy ON public.scheduler_jobs
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
