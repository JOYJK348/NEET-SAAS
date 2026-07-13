-- ============================================================================
-- SQL File: 09.03_live_class_sessions.sql
-- Domain: Live Class Sessions Tracking (Execution Instance Level)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Models distinct execution timelines for a single live class (supports restarts/resets).
-- 2. Embeds external identifier mapping details and network metrics.
-- 3. Provides provider_metadata JSONB column for zoom/teams configuration settings payload.
-- 4. Automatically touch audit fields upon changes.
-- 5. Leverages security definer constraints to ensure tenant alignment.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_sessions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    live_class_id UUID NOT NULL,
    session_number SMALLINT NOT NULL DEFAULT 1,
    
    -- Third-party Telephony Details
    provider_session_id VARCHAR(250) NULL,
    provider_metadata JSONB NULL,
    
    -- Status
    status session_status_enum NOT NULL DEFAULT 'CREATED',
    ended_reason session_end_reason_enum NULL,
    
    -- Telemetry
    started_at TIMESTAMP WITH TIME ZONE NULL,
    ended_at TIMESTAMP WITH TIME ZONE NULL,
    host_joined_at TIMESTAMP WITH TIME ZONE NULL,
    host_left_at TIMESTAMP WITH TIME ZONE NULL,
    
    peak_participants INTEGER NOT NULL DEFAULT 0,
    network_quality_score DECIMAL(3,2) NULL, -- Range: 0.00 to 5.00
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcs_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcs_class FOREIGN KEY (tenant_id, live_class_id)
        REFERENCES public.live_classes(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_lcs_session_number CHECK (session_number > 0),
    CONSTRAINT chk_lcs_times CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT chk_lcs_host_times CHECK (host_left_at IS NULL OR host_left_at > host_joined_at),
    CONSTRAINT chk_lcs_peak CHECK (peak_participants >= 0),
    CONSTRAINT chk_lcs_network CHECK (network_quality_score IS NULL OR (network_quality_score >= 0.00 AND network_quality_score <= 5.00)),
    CONSTRAINT chk_lcs_version CHECK (version > 0)
);

-- 2. Unique: increment session number sequence uniquely per live class
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_lcs_class_sequence
    ON public.live_class_sessions(tenant_id, live_class_id, session_number)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_lcs_class ON public.live_class_sessions(live_class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcs_status ON public.live_class_sessions(status) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_sessions DROP CONSTRAINT IF EXISTS uq_live_class_sessions_tenant_id CASCADE;
ALTER TABLE public.live_class_sessions ADD CONSTRAINT uq_live_class_sessions_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_sessions_touch_audit ON public.live_class_sessions;
CREATE TRIGGER trg_biu_live_class_sessions_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_sessions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_sessions_policy ON public.live_class_sessions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_sessions_policy ON public.live_class_sessions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_sessions_policy ON public.live_class_sessions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_sessions_policy ON public.live_class_sessions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
