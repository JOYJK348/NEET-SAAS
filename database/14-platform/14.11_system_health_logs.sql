-- ============================================================================
-- SQL File: 14.11_system_health_logs.sql
-- Domain: System Infrastructure health telemetry (Monitoring context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs hardware health status (CPU, memory, database parameters).
-- 2. Strictly append-only; update/delete operations raise DB exceptions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.system_health_logs (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    cpu_utilization_pct DECIMAL(5,2) NOT NULL,
    memory_utilization_pct DECIMAL(5,2) NOT NULL,
    disk_utilization_pct DECIMAL(5,2) NOT NULL,
    
    db_connections_count INTEGER NOT NULL,
    redis_connected BOOLEAN NOT NULL DEFAULT true,
    
    metrics_payload JSONB NULL, -- Storage capacity, detailed latency stats
    
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_shl_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_shl_cpu CHECK (cpu_utilization_pct BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_shl_memory CHECK (memory_utilization_pct BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_shl_disk CHECK (disk_utilization_pct BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_shl_connections CHECK (db_connections_count >= 0),
    CONSTRAINT chk_shl_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_shl_poller ON public.system_health_logs(tenant_id, logged_at DESC) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_system_health_logs_touch_audit ON public.system_health_logs;
CREATE TRIGGER trg_biu_system_health_logs_touch_audit
    BEFORE INSERT OR UPDATE ON public.system_health_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on logs)
CREATE OR REPLACE FUNCTION public.prevent_system_health_log_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: Hardware health logs are append-only. Updates are forbidden.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: Hardware health logs are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_system_health_log ON public.system_health_logs;
CREATE TRIGGER trg_ud_prevent_system_health_log
    BEFORE UPDATE OR DELETE ON public.system_health_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_system_health_log_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_system_health_logs_policy ON public.system_health_logs
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_system_health_logs_policy ON public.system_health_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE/DELETE policies needed as triggers raise exceptions anyway
