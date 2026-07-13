-- ============================================================================
-- SQL File: 09.09_live_class_polls.sql
-- Domain: Session Polls and Questions (Interaction Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps teacher-generated questions / polls launched in a session.
-- 2. Supports anonymity filters, multi-select questions, and time limits.
-- 3. Enables live statistical dashboards visibility configurations.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_polls (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    
    -- Poll parameters
    question VARCHAR(500) NOT NULL,
    options JSONB NOT NULL, -- e.g. [{"label": "A", "text": "Option A"}, {"label": "B", "text": "Option B"}]
    poll_type poll_type_enum NOT NULL DEFAULT 'MCQ',
    correct_answer VARCHAR(50) NULL, -- Matching label or index
    
    -- Feature gates
    allow_multiple BOOLEAN NOT NULL DEFAULT false,
    anonymous BOOLEAN NOT NULL DEFAULT false,
    time_limit_seconds SMALLINT NULL,
    
    show_results_live BOOLEAN NOT NULL DEFAULT true,
    publish_result_after_close BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    status poll_status_enum NOT NULL DEFAULT 'DRAFT',
    
    -- Timing
    starts_at TIMESTAMP WITH TIME ZONE NULL,
    ends_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcpoll_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcpoll_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_lcpoll_question CHECK (length(trim(question)) > 0),
    CONSTRAINT chk_lcpoll_time_limit CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
    CONSTRAINT chk_lcpoll_times CHECK (ends_at IS NULL OR starts_at IS NOT NULL),
    CONSTRAINT chk_lcpoll_ends CHECK (ends_at IS NULL OR ends_at > starts_at),
    CONSTRAINT chk_lcpoll_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcpoll_session ON public.live_class_polls(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcpoll_status ON public.live_class_polls(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_polls DROP CONSTRAINT IF EXISTS uq_live_class_polls_tenant_id CASCADE;
ALTER TABLE public.live_class_polls ADD CONSTRAINT uq_live_class_polls_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_polls_touch_audit ON public.live_class_polls;
CREATE TRIGGER trg_biu_live_class_polls_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_polls
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_polls_policy ON public.live_class_polls
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_polls_policy ON public.live_class_polls
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_polls_policy ON public.live_class_polls
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_polls_policy ON public.live_class_polls
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
