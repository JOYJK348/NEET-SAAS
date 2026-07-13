-- ============================================================================
-- SQL File: 02.09_auth_events.sql
-- Domain: Security Audit Logs & Access Control Events
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "auth_events" is a strict append-only table. UPDATE and DELETE are blocked via trigger rules.
-- 2. Preserves tenant historical context by snapshotting tenant_id. No foreign key constraints mapping
--    to institutes are defined, preserving audit log records beyond tenant lifetimes.
-- 3. Stores session_id (nullable FK) to trace logins, events, and logouts.
-- 4. Stores email string to capture failed login attempts with non-existent accounts.
-- 5. Native INET format is used to handle client IP tracking.
-- 6. GIN index is configured on details JSONB to optimize structured data searches.
-- 7. Documented: Large transaction volumes should eventually partition this table by month.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.auth_events (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NULL, -- Snapshot of tenant context (no FK constraint to survive tenant deletes)
    user_id UUID NULL, -- Nullable to capture invalid email login attempts
    session_id UUID NULL, -- Nullable to associate specific user device sessions
    
    email email_address NULL, -- Captured email address (useful for failed logins)
    event_type auth_event_type NOT NULL,
    
    ip_address INET NOT NULL,
    raw_user_agent TEXT NULL,
    
    location_country VARCHAR(100) NULL,
    location_region VARCHAR(100) NULL,
    location_timezone VARCHAR(100) NULL,
    
    details JSONB NULL, -- Flexible payload tracking error codes, MFA metadata, etc.
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Inline constraints & validations
    CONSTRAINT fk_events_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_events_session FOREIGN KEY (session_id) 
        REFERENCES public.user_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 2. Indexes for fast security compliance audits
CREATE INDEX IF NOT EXISTS idx_auth_events_tenant ON public.auth_events(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON public.auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_created ON public.auth_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_events_session ON public.auth_events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_events_created ON public.auth_events(created_at DESC);

-- GIN index for deep JSONB query lookups inside detail attributes
CREATE INDEX IF NOT EXISTS idx_auth_events_details ON public.auth_events USING GIN(details);

-- 3. Trigger to enforce append-only behavior (strictly blocks updates and deletes)
CREATE OR REPLACE FUNCTION public.lock_append_only_audit_logs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit log table is append-only. Modifying or deleting records is prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_dud_auth_events_lock ON public.auth_events;
CREATE TRIGGER trg_dud_auth_events_lock
    BEFORE UPDATE OR DELETE ON public.auth_events
    FOR EACH ROW
    EXECUTE FUNCTION public.lock_append_only_audit_logs();

-- 4. Row-Level Security Configuration
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Allows reading audit logs only to platform super admins and authorized security personnel)
DROP POLICY IF EXISTS policy_auth_events_select ON public.auth_events;
CREATE POLICY policy_auth_events_select
    ON public.auth_events
    FOR SELECT
    TO authenticated
    USING (
        current_user_is_super_admin()
        OR (
            tenant_id = current_tenant_id()
            AND EXISTS (
                -- Verify explicit RBAC permissions (security.audit.read) dynamically rather than static STAFF type checks.
                -- Lightweight checks: excludes now() evaluations from database RLS policies.
                SELECT 1 
                FROM public.user_roles ur
                JOIN public.role_permissions rp ON rp.role_id = ur.role_id
                JOIN public.permissions p ON p.id = rp.permission_id
                WHERE ur.user_id = auth.uid()
                  AND ur.is_active = true
                  AND p.code = 'security.audit.read'
                  AND p.deleted_at IS NULL
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.auth_events IS 'Security and authentication audit events log (Strictly Append-Only)';
COMMENT ON COLUMN public.auth_events.tenant_id IS 'Preserved tenant context snapshot resolved during the event';
COMMENT ON COLUMN public.auth_events.email IS 'Target login email address (useful for tracing failed inputs)';
COMMENT ON COLUMN public.auth_events.event_type IS 'Action type classifier (e.g. LOGIN_SUCCESS, MFA_FAILED)';
COMMENT ON COLUMN public.auth_events.details IS 'Structured audit payload attributes (indexed via GIN)';
COMMENT ON COLUMN public.auth_events.created_at IS 'Audit timestamp (event partitioning can base on this column)';
