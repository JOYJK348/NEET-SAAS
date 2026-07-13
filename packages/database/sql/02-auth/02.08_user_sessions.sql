-- ============================================================================
-- SQL File: 02.08_user_sessions.sql
-- Domain: Authentication Active User Sessions Directory
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "user_sessions" tracks metadata for active client devices (IP, Browser, OS, Expiry).
-- 2. Fully normalized: tenant_id is omitted, derived via join with public.users.
-- 3. Enforces unique active sessions per user device via partial unique index.
-- 4. Added "logged_out_at" to differentiate user logouts from administrator revokes.
-- 5. Added integrity CHECK constraint verifying matching combinations of status, revoked_at, and logged_out_at.
-- 6. RLS limits SELECT queries strictly to the session owner or platform Super Admins.
-- 7. Added "platform_session_id" tracking key to link sessions directly back to Supabase auth events.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    user_id UUID NOT NULL,
    
    platform_session_id UUID NULL, -- Links directly to Supabase internal session identifiers (auth.sessions.id)
    device_fingerprint VARCHAR(100) NOT NULL,
    device_name VARCHAR(100) NULL, -- Readable description (e.g., Jay's MacBook, Office PC)
    
    ip_address INET NOT NULL,
    
    device_type VARCHAR(50) NULL,
    browser_name VARCHAR(100) NULL,
    os_name VARCHAR(100) NULL,
    raw_user_agent TEXT NULL,
    
    status session_status_type NOT NULL DEFAULT 'ACTIVE',
    
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    logged_out_at TIMESTAMP WITH TIME ZONE NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Inline constraints & validations
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
        
    CONSTRAINT chk_sessions_expiry CHECK (expires_at > created_at),
    CONSTRAINT chk_sessions_revocation CHECK (revoked_at IS NULL OR revoked_at >= created_at),
    CONSTRAINT chk_sessions_logout CHECK (logged_out_at IS NULL OR logged_out_at >= created_at),
    -- State integrity validation check mapping
    CONSTRAINT chk_sessions_status_state CHECK (
        (status = 'ACTIVE' AND revoked_at IS NULL AND logged_out_at IS NULL)
        OR (status = 'REVOKED' AND revoked_at IS NOT NULL AND logged_out_at IS NULL)
        OR (status = 'LOGGED_OUT' AND logged_out_at IS NOT NULL AND revoked_at IS NULL)
        OR (status = 'EXPIRED' AND revoked_at IS NULL AND logged_out_at IS NULL)
    )
);

-- 2. Indexes for fast session lookup, activity updates, and audits
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON public.user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON public.user_sessions(platform_session_id) WHERE platform_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON public.user_sessions(expires_at) WHERE status = 'ACTIVE';

-- 2.1 Enforce single active session mapping per user device fingerprint environment
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sessions_user_active_device
    ON public.user_sessions(user_id, device_fingerprint)
    WHERE status = 'ACTIVE';

-- 3. Row-Level Security Configuration
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3.1 RLS Policies (Ensure users can only inspect their own active sessions catalog)
DROP POLICY IF EXISTS policy_user_sessions_select ON public.user_sessions;
CREATE POLICY policy_user_sessions_select
    ON public.user_sessions
    FOR SELECT
    TO authenticated
    USING (
        (user_id = auth.uid())
        OR current_user_is_super_admin()
    );

DROP POLICY IF EXISTS policy_user_sessions_delete ON public.user_sessions;
CREATE POLICY policy_user_sessions_delete
    ON public.user_sessions
    FOR DELETE
    TO authenticated
    USING (
        (user_id = auth.uid())
        OR current_user_is_super_admin()
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.user_sessions IS 'Authenticated user active device session metadata';
COMMENT ON COLUMN public.user_sessions.platform_session_id IS 'Audit trace link referencing Supabase internal auth.sessions.id keys';
COMMENT ON COLUMN public.user_sessions.device_fingerprint IS 'Unique client-generated environment hash';
COMMENT ON COLUMN public.user_sessions.device_name IS 'User-provided or resolved device description (e.g., iPhone 15 Pro)';
COMMENT ON COLUMN public.user_sessions.status IS 'Active lifecycle state (e.g. ACTIVE, REVOKED, EXPIRED, LOGGED_OUT)';
COMMENT ON COLUMN public.user_sessions.ip_address IS 'Native INET network address resolved during login transaction';
COMMENT ON COLUMN public.user_sessions.logged_out_at IS 'Timestamp of user voluntary logout events';
COMMENT ON COLUMN public.user_sessions.revoked_at IS 'Timestamp of administrator manual session terminations';
COMMENT ON COLUMN public.user_sessions.last_active_at IS 'Timestamp of last activity (application should throttle updates to e.g. >5 min)';
