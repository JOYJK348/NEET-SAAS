-- ============================================================================
-- SQL File: 14.10_api_logs.sql
-- Domain: Outbound API request logs (Monitoring context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs performance metrics (response codes, latencies) for all integrations calls.
-- 2. Strictly append-only; update/delete operations raise DB exceptions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    integration_name VARCHAR(100) NOT NULL, -- e.g. RAZORPAY, SENDGRID, METAPUSH
    endpoint_url VARCHAR(250) NOT NULL,
    
    request_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    response_code SMALLINT NOT NULL,
    latency_ms INTEGER NOT NULL,
    
    request_payload JSONB NULL,
    response_payload JSONB NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_apil_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_apil_method CHECK (request_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    CONSTRAINT chk_apil_latency CHECK (latency_ms >= 0),
    CONSTRAINT chk_apil_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_apil_monitor ON public.api_logs(tenant_id, integration_name, response_code) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_api_logs_touch_audit ON public.api_logs;
CREATE TRIGGER trg_biu_api_logs_touch_audit
    BEFORE INSERT OR UPDATE ON public.api_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on logs)
CREATE OR REPLACE FUNCTION public.prevent_api_log_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: API telemetry logs are append-only. Updates are forbidden.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: API telemetry logs are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_api_log ON public.api_logs;
CREATE TRIGGER trg_ud_prevent_api_log
    BEFORE UPDATE OR DELETE ON public.api_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_api_log_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_api_logs_policy ON public.api_logs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_api_logs_policy ON public.api_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE/DELETE policies needed as triggers raise exceptions anyway
