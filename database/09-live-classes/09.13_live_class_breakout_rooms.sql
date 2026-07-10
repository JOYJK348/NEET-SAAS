-- ============================================================================
-- SQL File: 09.13_live_class_breakout_rooms.sql
-- Domain: Session Breakout Rooms Layout (Group Activity Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Models dynamically generated small group breakout rooms within a main session.
-- 2. Embeds external provider breakout keys, timing properties, and focus scopes.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_breakout_rooms (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    
    -- Room configurations
    room_name VARCHAR(100) NOT NULL,
    provider_room_id VARCHAR(250) NULL,
    
    topic_focus VARCHAR(250) NULL,
    max_participants SMALLINT NOT NULL DEFAULT 20,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NULL,
    ended_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcbreak_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcbreak_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_lcbreak_name CHECK (length(trim(room_name)) > 0),
    CONSTRAINT chk_lcbreak_times CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT chk_lcbreak_capacity CHECK (max_participants > 0),
    CONSTRAINT chk_lcbreak_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcbreak_session ON public.live_class_breakout_rooms(session_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_breakout_rooms DROP CONSTRAINT IF EXISTS uq_live_class_breakout_rooms_tenant_id CASCADE;
ALTER TABLE public.live_class_breakout_rooms ADD CONSTRAINT uq_live_class_breakout_rooms_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_breakout_rooms_touch_audit ON public.live_class_breakout_rooms;
CREATE TRIGGER trg_biu_live_class_breakout_rooms_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_breakout_rooms
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_breakout_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_breakout_rooms_policy ON public.live_class_breakout_rooms
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_breakout_rooms_policy ON public.live_class_breakout_rooms
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_breakout_rooms_policy ON public.live_class_breakout_rooms
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_breakout_rooms_policy ON public.live_class_breakout_rooms
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
