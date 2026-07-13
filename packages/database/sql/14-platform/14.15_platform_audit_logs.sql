-- ============================================================================
-- SQL File: 14.15_platform_audit_logs.sql
-- Domain: Append-Only Platform Audit logs (Audit ledger)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs administrative edits (Feature toggles, API keys rot, cron job schedules updates).
-- 2. Strictly append-only; update/delete operations raise database exceptions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    event_type platform_audit_event_enum NOT NULL,
    description TEXT NOT NULL,
    
    payload JSONB NULL,
    
    triggered_by UUID NULL, -- References public.users.id
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pal_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_pal_user FOREIGN KEY (triggered_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_pal_desc CHECK (length(trim(description)) > 0),
    CONSTRAINT chk_pal_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pal_type ON public.platform_audit_logs(event_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pal_date ON public.platform_audit_logs(occurred_at) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_platform_audit_logs_touch_audit ON public.platform_audit_logs;
CREATE TRIGGER trg_biu_platform_audit_logs_touch_audit
    BEFORE INSERT OR UPDATE ON public.platform_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on logs)
CREATE OR REPLACE FUNCTION public.prevent_platform_audit_log_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: Platform audit logs are append-only. Updates are forbidden.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: Platform audit logs are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_platform_audit_log ON public.platform_audit_logs;
CREATE TRIGGER trg_ud_prevent_platform_audit_log
    BEFORE UPDATE OR DELETE ON public.platform_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_platform_audit_log_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_platform_audit_logs_policy ON public.platform_audit_logs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_platform_audit_logs_policy ON public.platform_audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE/DELETE policies needed as triggers raise exceptions anyway
