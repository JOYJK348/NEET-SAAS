-- ============================================================================
-- SQL File: 14.14_platform_events.sql
-- Domain: Event-Driven platform messaging bus
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Ledger tracks internal system milestones event topics (e.g. USER_REGISTERED).
-- 2. Strictly append-only; update/delete operations raise DB exceptions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.platform_events (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    event_topic VARCHAR(100) NOT NULL, -- e.g. STUDENT.ADMITTED, PAYMENT.SUCCESS
    event_payload JSONB NOT NULL,
    
    triggered_by_user UUID NULL, -- References public.users.id
    dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_pe_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_pe_user FOREIGN KEY (triggered_by_user)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_pe_topic CHECK (length(trim(event_topic)) > 0),
    CONSTRAINT chk_pe_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pe_topic_date ON public.platform_events(event_topic, dispatched_at) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_platform_events_touch_audit ON public.platform_events;
CREATE TRIGGER trg_biu_platform_events_touch_audit
    BEFORE INSERT OR UPDATE ON public.platform_events
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Force Append-Only rule (blocks updates and deletes on event logs)
CREATE OR REPLACE FUNCTION public.prevent_platform_event_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Constraint Violation: Platform event bus logs are append-only. Updates are forbidden.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Constraint Violation: Platform event bus logs are append-only. Deletes are forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ud_prevent_platform_event ON public.platform_events;
CREATE TRIGGER trg_ud_prevent_platform_event
    BEFORE UPDATE OR DELETE ON public.platform_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_platform_event_modification();

-- 4. Row-Level Security Configuration
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_platform_events_policy ON public.platform_events
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_platform_events_policy ON public.platform_events
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Note: no UPDATE/DELETE policies needed as triggers raise exceptions anyway
