-- ============================================================================
-- SQL File: 09.15_live_class_events.sql
-- Domain: Session Timeline Trace Event Ledger (Audit Trails / AI Processing Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Provides an append-only transaction registry tracking lecture timelines.
-- 2. Blocks updates and deletes to preserve historical audit logging capabilities.
-- 3. Enables clean debugging, AI post-session summaries generation, and compliance checks.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_events (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    
    -- Event characteristics
    event_type live_class_event_type_enum NOT NULL,
    
    -- JSONB payload to host variable telemetry characteristics
    -- e.g. {"mic_toggled_to": "OFF"}, {"poll_options": ["A", "B"]}
    event_payload JSONB NULL,
    
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
    CONSTRAINT fk_lcevt_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcevt_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcevt_user FOREIGN KEY (triggered_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_lcevt_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcevt_session ON public.live_class_events(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcevt_type_time ON public.live_class_events(session_id, event_type, occurred_at) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_events_touch_audit ON public.live_class_events;
CREATE TRIGGER trg_biu_live_class_events_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_events
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on logs)
CREATE OR REPLACE FUNCTION public.prevent_live_class_event_log_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: Event logs are append-only. Updates are forbidden.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: Event logs are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_live_class_event ON public.live_class_events;
CREATE TRIGGER trg_ud_prevent_live_class_event
    BEFORE UPDATE OR DELETE ON public.live_class_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_live_class_event_log_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_events_policy ON public.live_class_events
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_events_policy ON public.live_class_events
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE/DELETE policies needed as triggers raise exceptions anyway
